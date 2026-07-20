const express = require("express");
const crypto = require("crypto");
const { verifyPayment, createRazorpayOrder } = require("../services/paymentService");
const { Order } = require("../models/Order");
const { Product } = require("../models/Product");
const { AuditLog } = require("../models/AuditLog");
const { Cart } = require("../models/Cart");
const { protect } = require("../middleware/guards");
const { ProcessedWebhook } = require("../models/ProcessedWebhook");
const { TransactionLedger } = require("../models/TransactionLedger");
const { createNotification } = require("../services/notificationService");

const router = express.Router();

/**
 * POST /api/payments/create-order
 * Create a Razorpay order for marketplace checkout (alias for /api/orders/checkout)
 */
router.post("/create-order", protect, async (req, res, next) => {
  try {
    const { amount, currency = "INR", receipt } = req.body || {};
    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    const rzpOrder = await createRazorpayOrder(
      Number(amount),
      receipt || `rcpt_${req.user._id}_${Date.now()}`
    );

    if (!rzpOrder) {
      // Demo fallback when Razorpay is not configured
      return res.status(200).json({
        success: true,
        message: "Demo order created",
        data: {
          razorpayOrderId: `demo_order_${Date.now()}`,
          amount: Math.round(Number(amount) * 100),
          currency: "INR",
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Razorpay order created",
      data: {
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
      },
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/payments/webhook
 * Razorpay webhook — verifies payment and marks order paid with webhook idempotency logic.
 */
router.post("/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const body = req.body;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, event_id } = body || {};

    // Check webhook event idempotency
    if (event_id) {
      const alreadyProcessed = await ProcessedWebhook.findOne({ eventId: event_id });
      if (alreadyProcessed) {
        return res.status(200).json({ success: true, message: "Webhook event already processed" });
      }
      await ProcessedWebhook.create({ eventId: event_id });
    }

    if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const isValid = await verifyPayment(razorpay_signature, razorpay_order_id, razorpay_payment_id);
      if (!isValid) {
        return res.status(400).json({ success: false, message: "Invalid signature" });
      }

      const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      if (order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        order.razorpayPaymentId = razorpay_payment_id;
        await order.save();

        for (const item of order.items) {
          const product = await Product.findById(item.product);
          if (product) {
            product.stock = Math.max(0, product.stock - item.quantity);
            if (product.stock === 0) product.status = "out_of_stock";
            await product.save();
          }
        }

        // Create transaction ledger entries
        await TransactionLedger.create({
          type: "debit",
          amount: order.totalAmount,
          source: "Marketplace Purchase",
          referenceId: order._id,
          referenceType: "Order",
          user: order.user,
        });

        // Trigger dynamic socket.io updates and web notification
        const io = req.app.get("io");
        const notif = await createNotification({
          recipient: order.user,
          recipientModel: "User",
          title: "Payment Successful",
          message: `Your payment of ₹${order.totalAmount} for Order ${order._id} was successfully processed.`,
          type: "payment_success",
          metadata: { orderId: order._id, paymentId: razorpay_payment_id },
        });

        if (io) {
          io.to(String(order.user)).emit("notification:new", notif);
          io.to(String(order.user)).emit("payment:success", { orderId: order._id });
        }

        await AuditLog.create({
          action: "payment_webhook_success",
          user: order.user,
          details: { orderId: order._id, razorpay_payment_id },
        });
      }

      return res.status(200).json({ success: true, message: "Payment verified successfully" });
    }

    return res.status(400).json({ success: false, message: "Invalid payload" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * POST /api/payments/verify
 * Client-side payment verification after Razorpay checkout
 */
router.post("/verify", protect, async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing required payment fields" });
    }

    const isValid = await verifyPayment(razorpay_signature, razorpay_order_id, razorpay_payment_id);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.paymentStatus !== "paid") {
      order.paymentStatus = "paid";
      order.razorpayPaymentId = razorpay_payment_id;
      await order.save();

      // Reduce stock
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock = Math.max(0, product.stock - item.quantity);
          if (product.stock === 0) product.status = "out_of_stock";
          await product.save();
        }
      }

      // Clear user cart
      await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

      // Create ledger entry
      await TransactionLedger.create({
        type: "debit",
        amount: order.totalAmount,
        source: "Marketplace Purchase",
        referenceId: order._id,
        referenceType: "Order",
        user: req.user._id,
      });

      // Emit notifications
      const io = req.app.get("io");
      const notif = await createNotification({
        recipient: req.user._id,
        recipientModel: req.user.constructor.modelName,
        title: "Payment Successful",
        message: `Your payment of ₹${order.totalAmount} for Order ${order._id} was successfully processed.`,
        type: "payment_success",
        metadata: { orderId: order._id, paymentId: razorpay_payment_id },
      });

      if (io) {
        io.to(String(req.user._id)).emit("notification:new", notif);
        io.to(String(req.user._id)).emit("payment:success", { orderId: order._id });
        io.to(String(req.user._id)).emit("revenue:updated");
      }

      await AuditLog.create({
        action: "payment_verify_success",
        user: req.user._id,
        details: { orderId: order._id, razorpay_payment_id },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified and order processed successfully",
      data: order,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = { paymentRoutes: router };

