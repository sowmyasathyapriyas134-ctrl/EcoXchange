const mongoose = require("mongoose");

const membershipPurchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: String,
      default: "permanent",
    },
    amount: {
      type: Number,
      default: 300,
    },
    binSize: {
      type: String,
      enum: ["small", "medium", "large"],
      required: true,
    },
    razorpayOrderId: {
      type: String,
      default: "",
    },
    razorpayPaymentId: {
      type: String,
      default: "",
    },
    razorpaySignature: {
      type: String,
      default: "",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const MembershipPurchase = mongoose.model(
  "MembershipPurchase",
  membershipPurchaseSchema
);

module.exports = { MembershipPurchase };
