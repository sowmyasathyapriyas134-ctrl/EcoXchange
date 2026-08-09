const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    ownerModel: {
      type: String,
      enum: ["User", "Recycler", "DeliveryAgent", "Admin", "Supervisor"],
      required: true,
    },
    availableBalance: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 },
    lifetimeEarnings: { type: Number, default: 0 },
    lifetimeWithdrawals: { type: Number, default: 0 },
    cashbackBalance: { type: Number, default: 0 },
    rewardBalance: { type: Number, default: 0 },
    ecoPointsBalance: { type: Number, default: 0 },
  },
  { timestamps: true },
);

walletSchema.index({ ownerId: 1, ownerModel: 1 }, { unique: true });

const Wallet = mongoose.model("Wallet", walletSchema);
module.exports = { Wallet };
