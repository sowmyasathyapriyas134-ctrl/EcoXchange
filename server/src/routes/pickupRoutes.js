const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  createPickup,
  getMyPickups,
  getPickupById,
  cancelPickup,
  getPendingPickups,
  approvePickup,
  rejectPickup,
  assignAgent,
  getAssignedPickups,
  acceptPickup,
  startPickup,
  completePickup,
  getAllPickups,
  getPickupQrToken,
} = require("../controllers/pickupController");
const { uploadSingleImage } = require("../middleware/uploadMiddleware");

const pickupRouter = express.Router();

// MEMBER
pickupRouter.post(
  "/",
  protect,
  authorizeRoles("trial_member", "member"),
  uploadSingleImage("memberImage"),
  createPickup,
);
pickupRouter.get(
  "/my",
  protect,
  authorizeRoles("trial_member", "member"),
  getMyPickups,
);
pickupRouter.get(
  "/:id",
  protect,
  authorizeRoles("trial_member", "member"),
  getPickupById,
);
pickupRouter.get(
  "/:id/qr-token",
  protect,
  authorizeRoles("trial_member", "member"),
  getPickupQrToken,
);
pickupRouter.patch(
  "/:id/cancel",
  protect,
  authorizeRoles("trial_member", "member"),
  cancelPickup,
);

// SUPERVISOR
pickupRouter.get(
  "/supervisor/pending",
  protect,
  authorizeRoles("supervisor"),
  getPendingPickups,
);
pickupRouter.patch(
  "/:id/approve",
  protect,
  authorizeRoles("supervisor"),
  approvePickup,
);
pickupRouter.patch(
  "/:id/reject",
  protect,
  authorizeRoles("supervisor"),
  rejectPickup,
);
pickupRouter.patch(
  "/:id/assign-agent",
  protect,
  authorizeRoles("supervisor"),
  assignAgent,
);

// DELIVERY AGENT
pickupRouter.get(
  "/agent/assigned",
  protect,
  authorizeRoles("delivery_agent"),
  getAssignedPickups,
);
pickupRouter.patch(
  "/:id/accept",
  protect,
  authorizeRoles("delivery_agent"),
  acceptPickup,
);
pickupRouter.patch(
  "/:id/start",
  protect,
  authorizeRoles("delivery_agent"),
  startPickup,
);
pickupRouter.patch(
  "/:id/complete",
  protect,
  authorizeRoles("delivery_agent"),
  uploadSingleImage("completionImage"),
  completePickup,
);

// ADMIN
pickupRouter.get("/admin/all", protect, authorizeRoles("admin"), getAllPickups);

module.exports = { pickupRouter };
