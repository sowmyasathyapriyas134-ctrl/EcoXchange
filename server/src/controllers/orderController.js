const mongoose = require("mongoose");
const { Product } = require("../models/Product");
const { Order } = require("../models/Order");
const { Cart } = require("../models/Cart");
const { createRazorpayOrder } = require("../services/paymentService");

const checkout = async (req, res, next) => {
  try {
    const { items, shippingAddress, fromCart } = req.body || {};
    let itemsToProcess = [];

    if (fromCart) {
      const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: "Cart is empty" });
      }
      itemsToProcess = cart.items.map(it => ({
        productId: it.product._id || it.product,
        quantity: Number(it.quantity)
      }));
    } else {
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: "items is required" });
      }
      itemsToProcess = items.map((it) => ({
        productId: it.productId || it.product,
        quantity: Number(it.quantity || 0),
      }));
    }

    // Load products and validate stock/approval
    const products = await Product.find({
      _id: { $in: itemsToProcess.map((x) => x.productId) },
      isApprovedByAdmin: true,
      status: { $in: ["active", "out_of_stock"] },
      isActive: true
    });

    if (products.length !== itemsToProcess.length) {
      return res.status(400).json({
        success: false,
        message: "One or more products are not available or inactive",
      });
    }

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));
    let subtotal = 0;
    const orderItems = [];

    // Stock check and calculation
    for (const it of itemsToProcess) {
      const product = productMap.get(it.productId.toString());
      if (!product) {
        return res.status(400).json({
          success: false,
          message: "Product not found",
        });
      }
      if (Number(product.stock || 0) < it.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }

      const lineTotal = Number(product.price) * it.quantity;
      subtotal += lineTotal;

      orderItems.push({
        product: product._id,
        quantity: it.quantity,
        unitPrice: product.price,
      });
    }

    const shipping = subtotal > 1000 ? 0 : 50; // free shipping over 1000
    const taxes = Math.round(subtotal * 0.18); // 18% tax demo
    const total = subtotal + shipping + taxes;

    const rzpOrder = await createRazorpayOrder(total, `order_${req.user._id}_${Date.now()}`);

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      subtotal,
      shipping,
      taxes,
      total,
      paymentStatus: "unpaid",
      deliveryStatus: "created",
      shippingAddress: shippingAddress || req.user.address || "",
      razorpayOrderId: rzpOrder ? rzpOrder.id : "demo_order_id",
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        order,
        razorpayOrderId: rzpOrder ? rzpOrder.id : "demo_order_id",
        amount: total * 100,
        currency: "INR"
      },
    });
  } catch (err) {
    return next(err);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("items.product", "name images price category")
      .limit(50);
    return res.json({ success: true, message: "Your orders fetched successfully", data: orders });
  } catch (err) {
    return next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .populate("items.product", "name images price category");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    return res.json({ success: true, message: "Order fetched successfully", data: order });
  } catch (err) {
    return next(err);
  }
};

module.exports = { checkout, getMyOrders, getOrderById };
