const mongoose = require("mongoose");

const processedWebhookSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const ProcessedWebhook = mongoose.model("ProcessedWebhook", processedWebhookSchema);

module.exports = { ProcessedWebhook };
