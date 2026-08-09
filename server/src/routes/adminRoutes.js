const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/requireAdmin");
const { canManageUser } = require("../middleware/permissionMiddleware");
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  suspendUser,
  restoreUser,
  deleteUser,
  createTrialMember,
  createPermanentMember,
  createSupervisor,
  createDeliveryAgent,
  createRecycler,
  createAdmin,
  createUserUnified,
  updateUserUnified,
  updateUserStatusUnified,
  resetUserPasswordUnified,
  promoteTrialMember,
} = require("../controllers/adminController");

const router = express.Router();

/** All admin portal APIs require authenticated admin */
router.use(protect, requireAdmin);

router.get("/users", getAllUsers);

router.post("/users", createUserUnified);

router.get("/users/:id", canManageUser(), getUserById);

router.patch("/users/:id", canManageUser(), updateUserUnified);

router.patch("/users/:id/role", canManageUser(), updateUserRole);

router.patch("/users/:id/status", canManageUser(), updateUserStatusUnified);

router.patch("/users/:id/password", canManageUser(), resetUserPasswordUnified);

router.patch("/users/:id/suspend", canManageUser(), suspendUser);

router.patch("/users/:id/restore", canManageUser(), restoreUser);

router.post("/users/:id/promote", canManageUser(), promoteTrialMember);
router.delete("/users/:id", canManageUser(), deleteUser);

router.post("/users/trial", createTrialMember);
router.post("/users/member", createPermanentMember);
router.post("/users/supervisor", createSupervisor);
router.post("/users/delivery-agent", createDeliveryAgent);
router.post("/users/recycler", createRecycler);
router.post("/create-admin", createAdmin);

module.exports = { adminRoutes: router };
