const express = require("express");
const { protect } = require("../middleware/guards");
const { requireAdmin } = require("../middleware/requireAdmin");
const {
  createMembershipOrder,
  verifyMembershipPayment,
  getMembershipStatus,
  getUserToolkit,
  getUserQRCode,
  getAdminMemberships,
  updateAdminToolkitStatus,
  regenerateUserQRAdmin,
} = require("../controllers/membershipController");

const router = express.Router();

// Public / Protected Member Endpoints
router.use(protect);

router.post("/create-order", createMembershipOrder);
router.post("/verify-payment", verifyMembershipPayment);
router.get("/status", getMembershipStatus);
router.get("/toolkit", getUserToolkit);
router.get("/qrcode", getUserQRCode);

// Admin Management Endpoints
router.get("/admin/list", requireAdmin, getAdminMemberships);
router.patch("/admin/:id/toolkit-status", requireAdmin, updateAdminToolkitStatus);
router.post("/admin/:userId/regenerate-qr", requireAdmin, regenerateUserQRAdmin);

module.exports = { membershipRoutes: router };