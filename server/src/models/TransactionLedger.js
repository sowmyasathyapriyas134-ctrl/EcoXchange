const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    referenceType: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

ledgerSchema.index({ user: 1 });
ledgerSchema.index({ timestamp: -1 });

const TransactionLedger = mongoose.model("TransactionLedger", ledgerSchema);

module.exports = { TransactionLedger };
