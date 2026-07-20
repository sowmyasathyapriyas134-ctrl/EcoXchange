const mongoose = require("mongoose");

const { Product } = require("../models/Product");
const { Order } = require("../models/Order");
const { createNotification } = require("../services/notificationService");
const { Pickup } = require("../models/Pickup");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getAllProducts = async (_req, res, next) => {
  try {
    const products = await Product.find({
      status: { $in: ["active", "draft"] },
      isApprovedByAdmin: true,
    })
      .sort({ createdAt: -1 })
      .limit(200);

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: products,
    });
  } catch (err) {
    return next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const product = await Product.findOne({
      _id: id,
      isApprovedByAdmin: true,
      status: { $in: ["active", "out_of_stock"] },
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: product,
    });
  } catch (err) {
    return next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      category,
      price,
      quantityAvailable,
      manufactureDate,
      expiryDate,
      materialsUsed,
      totalMaterialWeight,
      lifeSpan,
      sustainabilityScore,
      carbonSavedKg,
    } = req.body || {};

    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "name is required" });
    if (price === undefined)
      return res
        .status(400)
        .json({ success: false, message: "price is required" });
    if (quantityAvailable === undefined)
      return res
        .status(400)
        .json({ success: false, message: "quantityAvailable is required" });
    if (!manufactureDate)
      return res
        .status(400)
        .json({ success: false, message: "manufactureDate is required" });

    // Multer with memory storage provides req.files?.
    const images = [];
    if (req.files?.images) {
      for (const f of req.files.images) {
        if (f.path) images.push(f.path);
      }
    }

    // In this codebase, we upload to cloudinary later; for now accept image URLs from client/body
    // (Clients can also send `images` as JSON stringified array.)
    let parsedImages = [];
    if (req.body?.images) {
      try {
        parsedImages = JSON.parse(req.body.images);
      } catch {
        parsedImages = Array.isArray(req.body.images) ? req.body.images : [];
      }
    }

    const product = await Product.create({
      recycler: req.user._id,
      name,
      description: description || "",
      category: category || "",
      price: Number(price),
      quantityAvailable: Number(quantityAvailable),
      manufactureDate: new Date(manufactureDate),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      materialsUsed: materialsUsed || [],
      totalMaterialWeight: totalMaterialWeight
        ? Number(totalMaterialWeight)
        : 0,
      lifeSpan: lifeSpan || "",
      sustainabilityScore: sustainabilityScore
        ? Number(sustainabilityScore)
        : 0,
      carbonSavedKg: carbonSavedKg ? Number(carbonSavedKg) : 0,
      images: [...images, ...parsedImages].filter(Boolean),
      status: "draft",
      isApprovedByAdmin: false,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (err) {
    return next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id" });
    }

    const product = await Product.findById(id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    if (product.recycler.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const updated = await Product.findByIdAndUpdate(id, req.body || {}, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id" });
    }

    const product = await Product.findById(id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    if (product.recycler.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    return next(err);
  }
};

const getMyProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ recycler: req.user._id }).sort({
      createdAt: -1,
    });
    return res.status(200).json({
      success: true,
      message: "Your products fetched successfully",
      data: products,
    });
  } catch (err) {
    return next(err);
  }
};

// Consolidated order endpoints are now located in orderController.js

const approveProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id" });
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      { isApprovedByAdmin: true, status: "active" },
      { new: true, runValidators: true },
    );

    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    return res.status(200).json({
      success: true,
      message: "Product approved",
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
};

const rejectProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id" });
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      { isApprovedByAdmin: false, status: "archived" },
      { new: true, runValidators: true },
    );

    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    return res.status(200).json({
      success: true,
      message: "Product rejected",
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
};

const getAllOrders = async (_req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(500);
    return res.status(200).json({
      success: true,
      message: "All orders fetched successfully",
      data: orders,
    });
  } catch (err) {
    return next(err);
  }
};

const getMySalesReport = async (req, res, next) => {
  try {
    const myProducts = await Product.find({ recycler: req.user._id });
    const myProductIds = myProducts.map((p) => p._id);

    // compute revenue from orders
    const orders = await Order.find({ "items.product": { $in: myProductIds } });

    let revenue = 0;
    for (const order of orders) {
      for (const item of order.items) {
        if (
          myProductIds.some((id) => id.toString() === item.product.toString())
        ) {
          revenue += Number(item.unitPrice) * Number(item.quantity);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Sales report fetched successfully",
      data: {
        totalSales: revenue,
        totalOrders: orders.length,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const getMarketplaceAnalytics = async (_req, res, next) => {
  try {
    const totalProductsListed = await Product.countDocuments({
      isApprovedByAdmin: true,
    });
    const totalOrders = await Order.countDocuments({});
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const total = totalRevenue?.[0]?.total || 0;

    return res.status(200).json({
      success: true,
      message: "Marketplace analytics fetched successfully",
      data: {
        totalProductsListed,
        totalOrders,
        totalRevenue: total,
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  // public/member
  getAllProducts,
  getProductById,

  // recycler
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getMySalesReport,

  // admin
  approveProduct,
  rejectProduct,
  getAllOrders,
  getMarketplaceAnalytics,
};
