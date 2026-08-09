const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    recycler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recycler",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    zone: {
      type: String,
      required: true,
    },
    maxCapacity: {
      type: Number,
      required: true,
    },
    bookedCapacity: {
      type: Number,
      default: 0,
    },
    acceptedWasteCategories: {
      type: [String],
      default: [],
    },
    specialInstructions: {
      type: String,
      default: "",
    },
    recurrence: {
      type: String,
      enum: ["none", "daily", "weekly", "monthly"],
      default: "none",
    },
    status: {
      type: String,
      enum: ["active", "paused"],
      default: "active",
    },
  },
  { timestamps: true }
);

scheduleSchema.index({ recycler: 1 });
scheduleSchema.index({ date: 1 });
scheduleSchema.index({ status: 1 });

const RecyclerSchedule = mongoose.model("RecyclerSchedule", scheduleSchema);

module.exports = { RecyclerSchedule };
