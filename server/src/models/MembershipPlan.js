const mongoose = require("mongoose");

const membershipPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["silver", "gold", "platinum"],
      required: true,
      unique: true,
    },

    price: { type: Number, required: true, min: 0 },
    durationDays: { type: Number, required: true, min: 1 },
    benefits: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

const MembershipPlan = mongoose.model("MembershipPlan", membershipPlanSchema);

module.exports = { MembershipPlan };
