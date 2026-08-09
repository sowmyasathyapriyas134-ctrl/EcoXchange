const { User } = require("../models/User");
const { DeliveryAgent } = require("../models/DeliveryAgent");
const { Pickup } = require("../models/Pickup");
const { Proof } = require("../models/Proof");
const { LocationHistory } = require("../models/LocationHistory");
const { createNotification } = require("../services/notificationService");

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/supervisor/dashboard
// Returns richer stats than /api/dashboard/supervisor.
// Justified: /dashboard/supervisor only returns 5 scalar counters.
// This endpoint additionally returns recentPickups[] (array) which requires
// a different response shape — changing /dashboard/supervisor would break
// the existing hook useSupervisorDashboard used by the stub page.
// ─────────────────────────────────────────────────────────────────────────────
const getSupervisorDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todayCollections,
      pendingVerifications,
      assignedPickups,
      activeAgents,
      totalPending,
      totalCompleted,
      totalVerified,
      totalRejected,
      recentPickups,
    ] = await Promise.all([
      Pickup.countDocuments({ createdAt: { $gte: today } }),
      Pickup.countDocuments({ status: "completed", verificationStatus: "pending" }),
      Pickup.countDocuments({ status: { $in: ["assigned", "accepted", "in_progress"] } }),
      DeliveryAgent.countDocuments({ availabilityStatus: { $in: ["available", "busy"] } }),
      Pickup.countDocuments({ status: "pending" }),
      Pickup.countDocuments({ status: "completed" }),
      Pickup.countDocuments({ status: "completed", verificationStatus: "verified" }),
      Pickup.countDocuments({ status: "completed", verificationStatus: "rejected" }),
      Pickup.find({})
        .sort({ createdAt: -1 })
        .limit(8)
        .populate("user", "fullName email")
        .populate("assignedAgent", "name email")
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        todayCollections,
        pendingVerifications,
        assignedPickups,
        activeAgents,
        totalPending,
        totalCompleted,
        totalVerified,
        totalRejected,
        recentPickups,
      },
    });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/supervisor/users-by-area  (pre-existing, unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const getUsersByArea = async (req, res, next) => {
  try {
    const { area } = req.query;
    if (!area) return sendError(res, 400, "Area is required");

    const users = await User.find({
      "location.area": area,
      role: { $in: ["citizen", "member"] },
    })
      .select("-password")
      .lean();

    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/supervisor/assign-task  (pre-existing, unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const assignTask = async (req, res, next) => {
  try {
    const { memberId, agentId, notes } = req.body;
    if (!memberId || !agentId)
      return sendError(res, 400, "memberId and agentId are required");

    const member = await User.findById(memberId);
    if (!member) return sendError(res, 404, "Member not found");

    const agent = await DeliveryAgent.findById(agentId);
    if (!agent) return sendError(res, 404, "Delivery Agent not found");

    const pickup = await Pickup.create({
      user: memberId,
      status: "assigned",
      scheduledDate: new Date(),
      address: member.address || "",
      notes: notes || "Assigned by supervisor",
      wasteType: "plastic",
      estimatedWeight: 1,
      assignedAgent: agentId,
    });

    const populatedPickup = await Pickup.findById(pickup._id)
      .populate("user", "fullName phoneNumber location")
      .lean();

    const io = req.app.get("io");
    if (io) {
      io.to(String(agentId)).emit("task:assigned", populatedPickup);
    }

    return res.status(200).json({
      success: true,
      message: "Task assigned successfully",
      data: populatedPickup,
    });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/supervisor/agents  (pre-existing, enhanced with task counts)
// Justified: original returned raw DeliveryAgent docs with no task count.
// Adding activeTasks + completedTasks is additive — no field removed.
// ─────────────────────────────────────────────────────────────────────────────
const getAgents = async (req, res, next) => {
  try {
    const agents = await DeliveryAgent.find({}).select("-password").lean();

    const agentsWithTasks = await Promise.all(
      agents.map(async (agent) => {
        const [activeTasks, completedTasks] = await Promise.all([
          Pickup.countDocuments({
            assignedAgent: agent._id,
            status: { $in: ["assigned", "accepted", "in_progress"] },
          }),
          Pickup.countDocuments({ assignedAgent: agent._id, status: "completed" }),
        ]);
        return { ...agent, activeTasks, completedTasks };
      })
    );

    return res.status(200).json({ success: true, data: agentsWithTasks });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/supervisor/agent-locations  (pre-existing, unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const getAgentLocations = async (req, res, next) => {
  try {
    const agents = await DeliveryAgent.find({}).select("-password").lean();
    const locations = agents.map((agent) => ({
      _id: agent._id,
      name: agent.name || "Agent",
      currentLocation: agent.currentLocation || null,
      availabilityStatus: agent.availabilityStatus || "offline",
    }));
    return res.status(200).json({ success: true, data: locations });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/supervisor/agents/:id/history  (pre-existing, unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const getAgentHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await LocationHistory.find({ agentId: id })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();
    return res.status(200).json({ success: true, data: history });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/supervisor/pickups  (NEW — justified)
// Reason: GET /api/pickups/supervisor/pending is hardcoded to status:"pending".
// Assignments page needs all statuses, optional agentId filter, verificationStatus
// filter, and pagination. Modifying the existing endpoint would break its contract.
// ─────────────────────────────────────────────────────────────────────────────
const getPickupsForSupervisor = async (req, res, next) => {
  try {
    const { status, agentId, verificationStatus, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (agentId) query.assignedAgent = agentId;
    if (verificationStatus) query.verificationStatus = verificationStatus;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [pickups, total] = await Promise.all([
      Pickup.find(query)
        .populate("user", "fullName email phone")
        .populate("assignedAgent", "name email phone availabilityStatus currentLocation")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Pickup.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: pickups,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/supervisor/proofs  (NEW — justified)
// Reason: GET /api/delivery/proofs is authorizeRoles("delivery_agent") only.
// No existing endpoint returns completed pickups + embedded Proof records
// for supervisor review. The Verifications page requires both pickup metadata
// and proof image URLs in a single response.
// ─────────────────────────────────────────────────────────────────────────────
const getProofsForVerification = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { status: "completed", verificationStatus: "pending" };

    const [pickups, total] = await Promise.all([
      Pickup.find(query)
        .populate("user", "fullName email phone")
        .populate("assignedAgent", "name email phone")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Pickup.countDocuments(query),
    ]);

    const enriched = await Promise.all(
      pickups.map(async (pickup) => {
        const proofs = await Proof.find({ taskId: pickup._id })
          .sort({ createdAt: -1 })
          .lean();
        return { ...pickup, proofs };
      })
    );

    return res.status(200).json({
      success: true,
      data: enriched,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/supervisor/pickups/:id/verify  (NEW — justified)
// Reason: PATCH /api/pickups/:id/approve sets status:"approved" for initial
// approval before agent assignment. Verification is a POST-COMPLETION step
// that sets verificationStatus:"verified" + verifiedBy + verifiedAt and emits
// the pickup:verified socket event. Different field, different state, different
// semantic — reuse is impossible without breaking the approval flow.
// ─────────────────────────────────────────────────────────────────────────────
const verifyPickup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pickup = await Pickup.findById(id);
    if (!pickup) return sendError(res, 404, "Pickup not found");

    if (pickup.status !== "completed") {
      return sendError(res, 400, "Only completed pickups can be verified");
    }

    pickup.verificationStatus = "verified";
    pickup.verifiedBy = req.user._id;
    pickup.verifiedAt = new Date();
    await pickup.save();

    const io = req.app.get("io");
    if (io) {
      if (pickup.assignedAgent) {
        io.to(String(pickup.assignedAgent)).emit("pickup:verified", {
          pickupId: pickup._id,
          message: "Your pickup has been verified by the supervisor.",
        });
      }
      if (pickup.user) {
        io.to(String(pickup.user)).emit("notification", {
          title: "Pickup Verified ✅",
          message: `Your pickup has been verified. You earned ${pickup.ecoPointsAwarded || 0} EcoPoints!`,
          type: "pickup_completed",
          metadata: { pickupId: pickup._id },
        });
      }
    }

    if (pickup.user) {
      await createNotification({
        recipient: pickup.user,
        recipientModel: pickup.userModel || "User",
        title: "Pickup Verified ✅",
        message: `Your pickup has been verified by the supervisor. You earned ${pickup.ecoPointsAwarded || 0} EcoPoints!`,
        type: "pickup_completed",
        metadata: { pickupId: pickup._id },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Pickup verified successfully",
      data: pickup,
    });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/supervisor/pickups/:id/reject-verification  (NEW — justified)
// Reason: PATCH /api/pickups/:id/reject is for rejecting initial pickup requests
// (status:"pending" → status:"rejected", requires supervisor role).
// Verification rejection operates on verificationStatus:"rejected", resets
// the pickup's status back to "pending", clears assignedAgent so it can be
// reassigned, and emits pickup:rejected. Different state machine path.
// ─────────────────────────────────────────────────────────────────────────────
const rejectPickupVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return sendError(res, 400, "rejectionReason is required");
    }

    const pickup = await Pickup.findById(id);
    if (!pickup) return sendError(res, 404, "Pickup not found");

    pickup.verificationStatus = "rejected";
    pickup.verifiedBy = req.user._id;
    pickup.verifiedAt = new Date();
    pickup.rejectionReason = rejectionReason;
    pickup.status = "pending"; // reset so it can be reassigned
    pickup.assignedAgent = undefined;
    await pickup.save();

    const io = req.app.get("io");
    if (io) {
      if (pickup.user) {
        io.to(String(pickup.user)).emit("pickup:rejected", {
          pickupId: pickup._id,
          reason: rejectionReason,
        });
        io.to(String(pickup.user)).emit("notification", {
          title: "Pickup Rejected",
          message: `Your pickup was rejected: ${rejectionReason}. A new agent will be assigned.`,
          type: "pickup_rejected",
          metadata: { pickupId: pickup._id },
        });
      }
    }

    if (pickup.user) {
      await createNotification({
        recipient: pickup.user,
        recipientModel: pickup.userModel || "User",
        title: "Pickup Rejected ❌",
        message: `Supervisor rejected pickup: ${rejectionReason}. It will be reassigned.`,
        type: "pickup_rejected",
        metadata: { pickupId: pickup._id },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Pickup verification rejected",
      data: pickup,
    });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/supervisor/analytics  (NEW — justified)
// Reason: GET /api/analytics/supervisor returns only ecoPointsAwarded scalar.
// GET /api/analytics/admin/* endpoints are gated to admin role.
// Analytics page requires wasteByType breakdown, verificationStats,
// agentPerformance aggregation, and daily 30-day trend — none available
// to supervisor role through any existing endpoint.
// ─────────────────────────────────────────────────────────────────────────────
const getSupervisorAnalytics = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [wasteByType, verificationStats, agentPerformance, dailyTrend] =
      await Promise.all([
        Pickup.aggregate([
          { $match: { status: "completed" } },
          {
            $group: {
              _id: "$wasteType",
              count: { $sum: 1 },
              totalWeight: { $sum: { $ifNull: ["$actualWeight", 0] } },
            },
          },
          { $sort: { count: -1 } },
        ]),
        Pickup.aggregate([
          { $match: { status: "completed" } },
          {
            $group: {
              _id: "$verificationStatus",
              count: { $sum: 1 },
            },
          },
        ]),
        Pickup.aggregate([
          { $match: { status: "completed", assignedAgent: { $ne: null } } },
          {
            $group: {
              _id: "$assignedAgent",
              completedTasks: { $sum: 1 },
              totalWeight: { $sum: { $ifNull: ["$actualWeight", 0] } },
              totalPoints: { $sum: { $ifNull: ["$ecoPointsAwarded", 0] } },
            },
          },
          { $sort: { completedTasks: -1 } },
          { $limit: 10 },
        ]),
        Pickup.aggregate([
          { $match: { createdAt: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
                day: { $dayOfMonth: "$createdAt" },
              },
              total: { $sum: 1 },
              completed: {
                $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
              },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
        ]),
      ]);

    // Populate agent names for performance table
    const agentIds = agentPerformance.map((a) => a._id);
    const agents = await DeliveryAgent.find({ _id: { $in: agentIds } })
      .select("name email")
      .lean();
    const agentMap = Object.fromEntries(agents.map((a) => [String(a._id), a]));

    const enrichedAgentPerf = agentPerformance.map((a) => ({
      ...a,
      agent: agentMap[String(a._id)] || { name: "Unknown" },
    }));

    return res.status(200).json({
      success: true,
      data: {
        wasteByType,
        verificationStats,
        agentPerformance: enrichedAgentPerf,
        dailyTrend,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const { Wallet } = require("../models/Wallet");
const { findUserByEmail } = require("../utils/findUserByEmail");
const { findAccountByPhone } = require("../utils/findAccountByPhone");

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/supervisor/delivery-agents
// Allows Supervisor (or Admin) to create a Delivery Agent account.
// ─────────────────────────────────────────────────────────────────────────────
const createDeliveryAgentBySupervisor = async (req, res, next) => {
  try {
    const { name, fullName, email, phone, phoneNumber, password, address, vehicleType, vehicleNumber, employeeId } = req.body;
    const agentName = name || fullName;
    const agentPhone = phone || phoneNumber;

    if (!agentName || !email || !password || !agentPhone) {
      return sendError(res, 400, "Name, email, phone number, and password are required");
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return sendError(res, 400, "Email already registered");
    }

    const existingPhone = await findAccountByPhone(agentPhone);
    if (existingPhone) {
      return sendError(res, 400, "Phone number already registered");
    }

    const agent = await DeliveryAgent.create({
      name: agentName,
      email,
      phone: agentPhone,
      password,
      address: address || "",
      vehicleType: vehicleType || "",
      vehicleNumber: vehicleNumber || "",
      employeeId: employeeId || "",
      createdBySupervisor: req.user._id,
      assignedSupervisor: req.user.role === "supervisor" ? req.user._id : null,
    });

    await Wallet.create({ ownerId: agent._id, ownerModel: "DeliveryAgent" });

    return res.status(201).json({
      success: true,
      message: "Delivery agent created successfully",
      data: agent,
    });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/supervisor/delivery-agents/:id
// Update delivery agent details
// ─────────────────────────────────────────────────────────────────────────────
const updateDeliveryAgentBySupervisor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const agent = await DeliveryAgent.findById(id);
    if (!agent) return sendError(res, 404, "Delivery agent not found");

    if (updates.name || updates.fullName) agent.name = updates.name || updates.fullName;
    if (updates.phone || updates.phoneNumber) agent.phone = updates.phone || updates.phoneNumber;
    if (updates.address !== undefined) agent.address = updates.address;
    if (updates.vehicleType !== undefined) agent.vehicleType = updates.vehicleType;
    if (updates.vehicleNumber !== undefined) agent.vehicleNumber = updates.vehicleNumber;
    if (updates.employeeId !== undefined) agent.employeeId = updates.employeeId;

    await agent.save();

    return res.status(200).json({
      success: true,
      message: "Delivery agent updated successfully",
      data: agent,
    });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/supervisor/delivery-agents/:id/status
// Suspend / Restore delivery agent
// ─────────────────────────────────────────────────────────────────────────────
const updateDeliveryAgentStatusBySupervisor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isSuspended, suspendedReason } = req.body;

    const agent = await DeliveryAgent.findById(id);
    if (!agent) return sendError(res, 404, "Delivery agent not found");

    agent.isSuspended = Boolean(isSuspended);
    if (agent.isSuspended) {
      agent.suspendedAt = new Date();
      agent.suspendedReason = suspendedReason || "Suspended by supervisor";
    } else {
      agent.suspendedAt = undefined;
      agent.suspendedReason = undefined;
    }

    await agent.save();

    return res.status(200).json({
      success: true,
      message: `Delivery agent ${agent.isSuspended ? "suspended" : "restored"} successfully`,
      data: agent,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getSupervisorDashboardStats,
  getUsersByArea,
  assignTask,
  getAgents,
  getAgentLocations,
  getAgentHistory,
  getPickupsForSupervisor,
  getProofsForVerification,
  verifyPickup,
  rejectPickupVerification,
  getSupervisorAnalytics,
  createDeliveryAgentBySupervisor,
  updateDeliveryAgentBySupervisor,
  updateDeliveryAgentStatusBySupervisor,
};
