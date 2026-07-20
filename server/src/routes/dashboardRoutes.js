const express = require("express");
const { protect, authorize } = require("../middleware/guards");
const {
  getCitizenDashboard,
  getRecyclerDashboard,
  getSupervisorDashboard,
  getAdminDashboard
} = require("../controllers/dashboardController");

const router = express.Router();

router.get("/citizen", protect, authorize("citizen", "trial_member", "member"), getCitizenDashboard);
router.get("/recycler", protect, authorize("recycler"), getRecyclerDashboard);
router.get("/supervisor", protect, authorize("supervisor"), getSupervisorDashboard);
router.get("/admin", protect, authorize("admin"), getAdminDashboard);

module.exports = { dashboardRoutes: router };
