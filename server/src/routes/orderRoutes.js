const express = require("express");
const { protect, authorize } = require("../middleware/guards");
const { checkout, getMyOrders, getOrderById } = require("../controllers/orderController");

const router = express.Router();

// Create order + Razorpay order from cart or items list
router.post("/checkout", protect, authorize("citizen", "admin"), checkout);

// Get all orders for the current user
router.get("/my", protect, getMyOrders);

// Get single order
router.get("/:id", protect, getOrderById);

module.exports = { orderRoutes: router };
