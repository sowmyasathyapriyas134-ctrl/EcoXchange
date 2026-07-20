const express = require("express");
const { protect, authorize } = require("../middleware/guards");
const { uploadMultipleImages } = require("../middleware/uploadMiddleware");

const {
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getMySalesReport,
  getAllProducts,
  getProductById,
  approveProduct,
  rejectProduct,
  getAllOrders,
  getMarketplaceAnalytics,
} = require("../controllers/marketplaceController");
const { checkout, getMyOrders: getMyConsolidatedOrders } = require("../controllers/orderController");

const marketplaceRouter = express.Router();

// Public
marketplaceRouter.get("/products", getAllProducts);
marketplaceRouter.get("/products/:id", getProductById);

// Citizen (Trial or Permanent Member)
marketplaceRouter.post("/orders", protect, authorize("citizen", "admin"), checkout);
marketplaceRouter.get("/my-orders", protect, authorize("citizen", "admin"), getMyConsolidatedOrders);

// Recycler
const productImagesMiddleware = uploadMultipleImages([
  { name: "images", maxCount: 10 },
]);

marketplaceRouter.post(
  "/products",
  protect,
  authorize("recycler", "admin"),
  productImagesMiddleware,
  createProduct,
);

marketplaceRouter.put(
  "/products/:id",
  protect,
  authorize("recycler", "admin"),
  updateProduct,
);

marketplaceRouter.delete(
  "/products/:id",
  protect,
  authorize("recycler", "admin"),
  deleteProduct,
);

marketplaceRouter.get(
  "/my-products",
  protect,
  authorize("recycler", "admin"),
  getMyProducts,
);

marketplaceRouter.get(
  "/my-sales-report",
  protect,
  authorize("recycler", "admin"),
  getMySalesReport,
);

// Admin/Supervisor approvals
marketplaceRouter.put(
  "/products/:id/approve",
  protect,
  authorize("admin", "supervisor"),
  approveProduct,
);
marketplaceRouter.put(
  "/products/:id/reject",
  protect,
  authorize("admin", "supervisor"),
  rejectProduct,
);
marketplaceRouter.get(
  "/orders",
  protect,
  authorize("admin", "supervisor"),
  getAllOrders,
);
marketplaceRouter.get(
  "/analytics",
  protect,
  authorize("admin", "supervisor"),
  getMarketplaceAnalytics,
);

module.exports = { marketplaceRoutes: marketplaceRouter };
