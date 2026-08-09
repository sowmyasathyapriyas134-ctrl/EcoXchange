const mongoose = require("mongoose");

const ledgerEntrySchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userModel: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    type: {
      type: String,
      enum: [
        "membership_upgrade",
        "marketplace_sale",
        "marketplace_commission",
        "cashback_credit",
        "referral_bonus",
        "reward_credit",
        "withdrawal_request",
        "withdrawal_completed",
        "recycler_payment",
        "payout",
        "refund",
        "adjustment",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "posted", "failed", "reversed"],
      default: "posted",
    },
    referenceId: { type: String, default: "" },
    description: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

ledgerEntrySchema.index({ userId: 1, createdAt: -1 });

const LedgerEntry = mongoose.model("LedgerEntry", ledgerEntrySchema);
module.exports = { LedgerEntry };
