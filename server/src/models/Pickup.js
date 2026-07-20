const mongoose = require("mongoose");

const pickupSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "userModel",
      required: true,
    },
    userModel: { type: String, default: "User" },

    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryAgent",
    },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supervisor",
    },

    wasteType: {
      type: String,
      enum: ["plastic", "paper", "metal", "glass", "organic", "ewaste"],
      required: true,
    },

    estimatedWeight: { type: Number, required: true },
    actualWeight: { type: Number, default: 0 },

    address: { type: String, required: true },
    notes: { type: String },

    scheduledDate: { type: Date, required: true },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "assigned",
        "accepted",
        "in_progress",
        "completed",
        "cancelled",
        "failed",
      ],
      default: "pending",
    },

    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryAgent" },
        timestamp: { type: Date, default: Date.now },
        notes: { type: String },
      },
    ],

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Supervisor" },
    verifiedAt: { type: Date },

    qrScanned: { type: Boolean, default: false },
    qrScannedAt: { type: Date },

    destinationLat: { type: Number, default: 12.9716 },
    destinationLng: { type: Number, default: 77.5946 },

    memberImage: { type: String },
    completionImage: { type: String },

    rejectionReason: { type: String },
    completionNotes: { type: String },

    ecoPointsAwarded: { type: Number, default: 0 },

    // Phase 5: store earned points explicitly
    earnedPoints: { type: Number, default: 0 },

    // Phase 6: recycler module fields
    recycler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recycler",
      default: null,
    },

    recyclingStatus: {
      type: String,
      enum: ["pending", "accepted", "processed"],
      default: "pending",
    },

    recycledWeight: { type: Number, default: 0 },
    processingDate: Date,

    processingNotes: {
      type: String,
      default: "",
    },

    recyclingCertificate: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

pickupSchema.index({ assignedAgent: 1 });
pickupSchema.index({ status: 1 });

const Pickup = mongoose.model("Pickup", pickupSchema);

module.exports = { Pickup };
