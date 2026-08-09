const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    recipientModel: {
      type: String,
      required: true,
    },

    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },

    type: {
      type: String,
      required: true,
      enum: [
        "pickup_created",
        "pickup_approved",
        "pickup_rejected",
        "pickup_assigned",
        "pickup_completed",
        "reward_earned",
        "reward_redeemed",
        "membership_upgraded",
        "payment_success",
        "payment_failed",
        "system_alert",
        "schedule_created",
        "schedule_updated",
        "schedule_paused",
        "schedule_resumed",
        "schedule_deleted",
        "shipment_assigned",
        "shipment_accepted",
        "shipment_delivered",
        "receipt_confirmed",
        "shipment_completed",
        "payment_initiated",
        "payout_released",
      ],
    },

    isRead: { type: Boolean, default: false },

    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1 });
notificationSchema.index({ isRead: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = { Notification };
