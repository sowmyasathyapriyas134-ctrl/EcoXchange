const mongoose = require("mongoose");

const userToolkitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    dustbins: {
      count: { type: Number, default: 3 },
      size: { type: String, enum: ["small", "medium", "large"], required: true },
      delivered: { type: Boolean, default: false },
    },
    covers: {
      quantity: { type: Number, default: 100 },
    },
    qrStickers: {
      quantity: { type: Number, default: 100 },
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    deliveryStatus: {
      type: String,
      enum: ["processing", "dispatched", "delivered"],
      default: "processing",
    },
  },
  { timestamps: true }
);

const UserToolkit = mongoose.model("UserToolkit", userToolkitSchema);

module.exports = { UserToolkit };
