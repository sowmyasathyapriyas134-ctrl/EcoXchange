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
  createSupervisor,
  createDeliveryAgent,
  createRecycler,
  createAdmin,
} = require("../controllers/adminController");

const router = express.Router();

/** All admin portal APIs require authenticated admin */
router.use(protect, requireAdmin);

router.get("/users", getAllUsers);

router.get("/users/:id", canManageUser(), getUserById);

router.patch("/users/:id/role", canManageUser(), updateUserRole);

router.patch("/users/:id/suspend", canManageUser(), suspendUser);

router.patch("/users/:id/restore", canManageUser(), restoreUser);

router.delete("/users/:id", canManageUser(), deleteUser);

router.post("/create-supervisor", createSupervisor);
router.post("/create-delivery-agent", createDeliveryAgent);
router.post("/create-recycler", createRecycler);
router.post("/create-admin", createAdmin);

module.exports = { adminRoutes: router };
