const express = require("express");
const { protect, authorize } = require("../middleware/guards");
const {
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
} = require("../controllers/supervisorController");

const router = express.Router();

// All supervisor routes: JWT required + supervisor/admin role
router.use(protect);
router.use(authorize("supervisor", "admin"));

// ── Dashboard (richer than /api/dashboard/supervisor — includes recentPickups[]) ──
router.get("/dashboard", getSupervisorDashboardStats);

// ── Members ──────────────────────────────────────────────────────────────────
router.get("/users-by-area", getUsersByArea);

// ── Delivery Agents ───────────────────────────────────────────────────────────
// (pre-existing routes, getAgents now returns activeTasks + completedTasks)
router.get("/agents", getAgents);
router.get("/agent-locations", getAgentLocations);
router.get("/agents/:id/history", getAgentHistory);

// ── Pickups (all statuses, filterable) ───────────────────────────────────────
// NOTE: For assign/reassign use PATCH /api/pickups/:id/assign-agent (pickupRoutes)
router.get("/pickups", getPickupsForSupervisor);

// ── Proof Verification Queue ──────────────────────────────────────────────────
router.get("/proofs", getProofsForVerification);
router.patch("/pickups/:id/verify", verifyPickup);
router.patch("/pickups/:id/reject-verification", rejectPickupVerification);

// ── Manual Task Creation ──────────────────────────────────────────────────────
router.post("/assign-task", assignTask);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get("/analytics", getSupervisorAnalytics);

module.exports = { supervisorRoutes: router };
