const express = require("express");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { uploadSingleImage, handleUploadError } = require("../middleware/uploadMiddleware");
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/cloudinary");
const { Pickup } = require("../models/Pickup");
const { Proof } = require("../models/Proof");
const { LocationHistory } = require("../models/LocationHistory");
const { DeliveryAgent } = require("../models/DeliveryAgent");
const { AuditLog } = require("../models/AuditLog");
const { createNotification } = require("../services/notificationService");

const router = express.Router();

const QR_SECRET = process.env.QR_SECRET;
if (!QR_SECRET) {
  throw new Error("QR_SECRET environment variable is required");
}
const DELIVERY_COMPLETION_RADIUS = parseFloat(process.env.DELIVERY_COMPLETION_RADIUS || "500");

// Rate Limiters
const locationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  message: { success: false, message: "Too many location updates, please try again later." }
});
const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  message: { success: false, message: "Too many scans, please try again later." }
});
const proofLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  message: { success: false, message: "Too many proof uploads, please try again later." }
});

// Helper for distance calculation (Haversine formula)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // in metres
}

// Helper for logging audit entries
async function logAudit(userId, action, entityType, entityId, details = {}) {
  await AuditLog.create({
    action,
    user: userId,
    details: { entityType, entityId, ...details }
  });
}

// -------------------------------------------------------------
// 1. Tasks
// -------------------------------------------------------------

// GET all assigned tasks
router.get("/tasks", protect, authorizeRoles("delivery_agent"), async (req, res) => {
  try {
    const tasks = await Pickup.find({ assignedAgent: req.user._id }).sort({ scheduledDate: 1 });
    return res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET specific task details
router.get("/tasks/:id", protect, authorizeRoles("delivery_agent"), async (req, res) => {
  try {
    const task = await Pickup.findOne({ _id: req.params.id, assignedAgent: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found or unauthorized" });
    }
    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST Accept Task
router.post("/tasks/:id/accept", protect, authorizeRoles("delivery_agent"), async (req, res) => {
  try {
    const task = await Pickup.findOne({ _id: req.params.id, assignedAgent: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found or unauthorized" });
    }

    if (task.status !== "assigned") {
      return res.status(400).json({ success: false, message: `Cannot accept task in '${task.status}' state` });
    }

    task.status = "accepted";
    task.statusHistory.push({
      status: "accepted",
      changedBy: req.user._id,
      timestamp: new Date(),
      notes: "Task accepted by delivery agent"
    });
    await task.save();

    await logAudit(req.user._id, "task_accept", "Pickup", task._id);

    // Notify user
    await createNotification({
      recipient: task.user,
      recipientModel: task.userModel || "User",
      title: "Task Accepted",
      message: `Your pickup request has been accepted by agent ${req.user.name}.`,
      type: "pickup_assigned",
      metadata: { pickupId: task._id }
    });

    // Send Socket.IO real-time notification
    const io = req.app.get("io");
    if (io) {
      io.to(String(task.user)).emit("notification", {
        title: "Task Accepted",
        message: `Your pickup request has been accepted.`,
        type: "pickup_assigned",
        metadata: { pickupId: task._id }
      });
      io.to(String(req.user._id)).emit("task:accepted", { taskId: task._id });
    }

    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST Reject Task
router.post("/tasks/:id/reject", protect, authorizeRoles("delivery_agent"), async (req, res) => {
  try {
    const { reason } = req.body;
    const task = await Pickup.findOne({ _id: req.params.id, assignedAgent: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found or unauthorized" });
    }

    if (!["assigned", "accepted"].includes(task.status)) {
      return res.status(400).json({ success: false, message: `Cannot reject task in '${task.status}' state` });
    }

    task.status = "rejected";
    task.assignedAgent = undefined; // Free the task for reassignment
    task.statusHistory.push({
      status: "rejected",
      changedBy: req.user._id,
      timestamp: new Date(),
      notes: reason || "Rejected by delivery agent"
    });
    await task.save();

    await logAudit(req.user._id, "task_reject", "Pickup", task._id, { reason });

    const io = req.app.get("io");
    if (io) {
      io.to(String(task.user)).emit("notification", {
        title: "Task Rejected",
        message: "Your pickup task was rejected. A new agent will be assigned shortly.",
        type: "pickup_rejected",
        metadata: { pickupId: task._id }
      });
    }

    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST Pause Task
router.post("/tasks/:id/pause", protect, authorizeRoles("delivery_agent"), async (req, res) => {
  try {
    const { reason } = req.body;
    const task = await Pickup.findOne({ _id: req.params.id, assignedAgent: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found or unauthorized" });
    }

    if (task.status !== "in_progress") {
      return res.status(400).json({ success: false, message: `Cannot pause task in '${task.status}' state` });
    }

    task.status = "paused";
    task.statusHistory.push({
      status: "paused",
      changedBy: req.user._id,
      timestamp: new Date(),
      notes: reason || "Paused by delivery agent"
    });
    await task.save();

    await logAudit(req.user._id, "task_pause", "Pickup", task._id);

    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST Resume Task
router.post("/tasks/:id/resume", protect, authorizeRoles("delivery_agent"), async (req, res) => {
  try {
    const task = await Pickup.findOne({ _id: req.params.id, assignedAgent: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found or unauthorized" });
    }

    if (task.status !== "paused") {
      return res.status(400).json({ success: false, message: `Cannot resume task in '${task.status}' state` });
    }

    task.status = "in_progress";
    task.statusHistory.push({
      status: "in_progress",
      changedBy: req.user._id,
      timestamp: new Date(),
      notes: "Task resumed by delivery agent"
    });
    await task.save();

    await logAudit(req.user._id, "task_resume", "Pickup", task._id);

    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST Start Task
router.post("/tasks/:id/start", protect, authorizeRoles("delivery_agent"), async (req, res) => {
  try {
    const task = await Pickup.findOne({ _id: req.params.id, assignedAgent: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found or unauthorized" });
    }

    if (task.status !== "accepted") {
      return res.status(400).json({ success: false, message: `Cannot start task in '${task.status}' state` });
    }

    task.status = "in_progress";
    task.statusHistory.push({
      status: "in_progress",
      changedBy: req.user._id,
      timestamp: new Date(),
      notes: "Task started (in progress)"
    });
    await task.save();

    await logAudit(req.user._id, "task_start", "Pickup", task._id);

    // Notify user
    await createNotification({
      recipient: task.user,
      recipientModel: task.userModel || "User",
      title: "Agent En Route",
      message: `Delivery agent is on the way to collect your waste.`,
      type: "pickup_assigned",
      metadata: { pickupId: task._id }
    });

    const io = req.app.get("io");
    if (io) {
      io.to(String(task.user)).emit("notification", {
        title: "Agent En Route",
        message: `Delivery agent is on the way to collect your waste.`,
        type: "pickup_assigned",
        metadata: { pickupId: task._id }
      });
      io.to(String(req.user._id)).emit("task:started", { taskId: task._id });
    }

    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST Complete Task (Route Completion Validation)
router.post("/tasks/:id/complete", protect, authorizeRoles("delivery_agent"), async (req, res) => {
  try {
    const { actualWeight, completionNotes } = req.body;
    const task = await Pickup.findOne({ _id: req.params.id, assignedAgent: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found or unauthorized" });
    }

    if (task.status === "completed") {
      return res.status(400).json({ success: false, message: "Task already completed" });
    }

    if (task.status !== "in_progress") {
      return res.status(400).json({ success: false, message: `Cannot complete task in '${task.status}' state` });
    }

    // 1. Check if proof was uploaded
    const proofExists = await Proof.findOne({ taskId: task._id, deliveryAgent: req.user._id });
    if (!proofExists) {
      return res.status(400).json({ success: false, message: "Completion requires at least one uploaded proof of delivery" });
    }

    // 2. Check if QR code was scanned
    if (!task.qrScanned) {
      return res.status(400).json({ success: false, message: "Completion requires verifying customer QR code" });
    }

    // 3. Check if GPS coordinates are within configurable radius
    const lastLocation = await LocationHistory.findOne({ agentId: req.user._id }).sort({ timestamp: -1 });
    if (!lastLocation) {
      return res.status(400).json({ success: false, message: "No GPS tracking data found for agent" });
    }

    const distance = getDistance(
      lastLocation.latitude,
      lastLocation.longitude,
      task.destinationLat,
      task.destinationLng
    );

    if (distance > DELIVERY_COMPLETION_RADIUS) {
      return res.status(400).json({
        success: false,
        message: `Agent must be within ${DELIVERY_COMPLETION_RADIUS}m of destination to complete task. Current distance: ${Math.round(distance)}m`
      });
    }

    const { calculateEcoPoints } = require("../utils/calculateEcoPoints");
    const weight = actualWeight !== undefined ? parseFloat(actualWeight) : task.estimatedWeight;
    const pointsAwarded = calculateEcoPoints(task.wasteType, weight);

    task.status = "completed";
    task.actualWeight = weight;
    task.ecoPointsAwarded = pointsAwarded;
    task.earnedPoints = pointsAwarded;
    task.completionNotes = completionNotes || "";
    task.completionImage = proofExists.imageUrl; // link to uploaded proof image
    task.statusHistory.push({
      status: "completed",
      changedBy: req.user._id,
      timestamp: new Date(),
      notes: `Completed task. Actual weight: ${weight}kg.`
    });
    await task.save();

    await logAudit(req.user._id, "task_complete", "Pickup", task._id);

    // Update member's points and streak
    const { User } = require("../models/User");
    const member = await User.findById(task.user);
    if (member) {
      member.ecoPoints = (member.ecoPoints || 0) + pointsAwarded;
      if (member.role === "trial_member") {
        member.streakCount = (member.streakCount || 0) + 1;
        if (member.streakCount >= 5) {
          member.role = "member";
          member.membershipStatus = "active";
          member.trialCompleted = true;
        }
      }
      await member.save();
    }

    // Persist notification
    await createNotification({
      recipient: task.user,
      recipientModel: task.userModel || "User",
      title: "Pickup Completed",
      message: `Your pickup is complete. You earned ${pointsAwarded} EcoPoints!`,
      type: "pickup_completed",
      metadata: { pickupId: task._id }
    });

    const io = req.app.get("io");
    if (io) {
      io.to(String(task.user)).emit("notification", {
        title: "Pickup Completed",
        message: `Your pickup is complete. You earned ${pointsAwarded} EcoPoints!`,
        type: "pickup_completed",
        metadata: { pickupId: task._id }
      });
    }

    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// -------------------------------------------------------------
// 2. QR Scanning
// -------------------------------------------------------------

router.post("/scan", protect, authorizeRoles("delivery_agent"), scanLimiter, async (req, res) => {
  try {
    const { taskId, agentId, expiry, signature } = req.body;

    if (!taskId || !agentId || !expiry || !signature) {
      return res.status(400).json({ success: false, message: "Missing QR parameters" });
    }

    // Verify ownership
    if (String(agentId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "QR payload is not assigned to this agent" });
    }

    // Check expiration
    if (Date.now() > parseInt(expiry)) {
      return res.status(400).json({ success: false, message: "QR code has expired" });
    }

    // Validate Signature
    const expectedSignature = crypto
      .createHmac("sha256", QR_SECRET)
      .update(`${taskId}:${agentId}:${expiry}`)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({ success: false, message: "Invalid cryptographic QR signature" });
    }

    const task = await Pickup.findOne({ _id: taskId, assignedAgent: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: "Associated task not found or unauthorized" });
    }

    task.qrScanned = true;
    task.qrScannedAt = new Date();
    await task.save();

    await logAudit(req.user._id, "qr_validate", "Pickup", task._id);

    return res.status(200).json({ success: true, message: "QR token validated successfully", data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// -------------------------------------------------------------
// 3. Proof Capture
// -------------------------------------------------------------

router.post(
  "/proofs",
  protect,
  authorizeRoles("delivery_agent"),
  proofLimiter,
  uploadSingleImage("image"),
  handleUploadError,
  async (req, res) => {
    try {
      const { taskId, deviceType, captureTime, latitude, longitude } = req.body;

      if (!taskId) {
        return res.status(400).json({ success: false, message: "taskId is required" });
      }

      const task = await Pickup.findOne({ _id: taskId, assignedAgent: req.user._id });
      if (!task) {
        return res.status(404).json({ success: false, message: "Task not found or unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: "No image file provided" });
      }

      // Check MIME type explicitly
      const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ success: false, message: "Invalid file type. Only JPEG, PNG, and WebP are allowed." });
      }

      const uploadResult = await uploadToCloudinary(req.file.buffer, {
        folder: "ecoexchange/proofs"
      });

      if (!uploadResult || !uploadResult.secure_url) {
        return res.status(500).json({ success: false, message: "Failed to upload image to Cloudinary" });
      }

      const proof = await Proof.create({
        taskId: task._id,
        deliveryAgent: req.user._id,
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        deviceType: deviceType || req.headers["user-agent"] || "",
        captureTime: captureTime ? new Date(captureTime) : new Date(),
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        status: "verified" // auto-verified for this POC
      });

      await logAudit(req.user._id, "proof_upload", "Proof", proof._id, { taskId: task._id });

      return res.status(201).json({ success: true, data: proof });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
);

// GET proofs for agent
router.get("/proofs", protect, authorizeRoles("delivery_agent"), async (req, res) => {
  try {
    const proofs = await Proof.find({ deliveryAgent: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: proofs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET proof by ID
router.get("/proofs/:id", protect, authorizeRoles("delivery_agent"), async (req, res) => {
  try {
    const proof = await Proof.findOne({ _id: req.params.id, deliveryAgent: req.user._id });
    if (!proof) {
      return res.status(404).json({ success: false, message: "Proof not found or unauthorized" });
    }
    return res.status(200).json({ success: true, data: proof });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE proof
router.delete("/proofs/:id", protect, authorizeRoles("delivery_agent"), async (req, res) => {
  try {
    const proof = await Proof.findOne({ _id: req.params.id, deliveryAgent: req.user._id });
    if (!proof) {
      return res.status(404).json({ success: false, message: "Proof not found or unauthorized" });
    }

    // Delete asset from Cloudinary
    if (proof.publicId) {
      await deleteFromCloudinary(proof.publicId);
    }

    await Proof.deleteOne({ _id: proof._id });

    await logAudit(req.user._id, "proof_delete", "Proof", proof._id);

    return res.status(200).json({ success: true, message: "Proof deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// -------------------------------------------------------------
// 4. GPS Tracking / Locations
// -------------------------------------------------------------

router.post("/location", protect, authorizeRoles("delivery_agent"), locationLimiter, async (req, res) => {
  try {
    const { taskId, latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: "Missing coordinates" });
    }

    const logEntry = await LocationHistory.create({
      agentId: req.user._id,
      taskId: taskId || undefined,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: new Date()
    });

    // Update agent's current location
    await DeliveryAgent.findByIdAndUpdate(req.user._id, {
      currentLocation: {
        lat: parseFloat(latitude),
        lng: parseFloat(longitude)
      }
    });

    return res.status(200).json({ success: true, data: logEntry });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// -------------------------------------------------------------
// 5. Analytics
// -------------------------------------------------------------

router.get("/analytics", protect, authorizeRoles("delivery_agent"), async (req, res) => {
  try {
    const agentId = req.user._id;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Tasks today
    const tasksToday = await Pickup.countDocuments({
      assignedAgent: agentId,
      createdAt: { $gte: startOfToday }
    });

    // Completed
    const completedTasks = await Pickup.countDocuments({
      assignedAgent: agentId,
      status: "completed"
    });

    // Cancelled / Failed
    const failedTasks = await Pickup.countDocuments({
      assignedAgent: agentId,
      status: { $in: ["cancelled", "failed", "rejected"] }
    });

    // Average delivery duration (from start to complete)
    const completedTasksList = await Pickup.find({
      assignedAgent: agentId,
      status: "completed"
    });

    let totalDurationMs = 0;
    let countedTasks = 0;

    for (const task of completedTasksList) {
      const startHist = task.statusHistory.find((h) => h.status === "in_progress");
      const endHist = task.statusHistory.find((h) => h.status === "completed");

      if (startHist && endHist) {
        totalDurationMs += new Date(endHist.timestamp) - new Date(startHist.timestamp);
        countedTasks++;
      }
    }

    const averageDeliveryTimeMinutes = countedTasks > 0 ? Math.round(totalDurationMs / (60 * 1000) / countedTasks) : 0;

    // Proof success rate
    const totalProofs = await Proof.countDocuments({ deliveryAgent: agentId });
    const successProofs = await Proof.countDocuments({ deliveryAgent: agentId, status: "verified" });
    const proofUploadSuccessRate = totalProofs > 0 ? Math.round((successProofs / totalProofs) * 100) : 100;

    // Estimated distance covered (mock calculations based on location history count * avg step or actual distance)
    const locationPointsCount = await LocationHistory.countDocuments({ agentId });
    const distanceCoveredKm = Math.round((locationPointsCount * 0.1) * 10) / 10; // rough proxy: 100m per location update ping

    return res.status(200).json({
      success: true,
      data: {
        tasksToday,
        completedTasks,
        failedTasks,
        averageDeliveryTimeMinutes,
        distanceCoveredKm,
        proofUploadSuccessRate
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = { deliveryRouter: router };
