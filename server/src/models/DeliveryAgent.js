const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const deliveryAgentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    phone: { type: String, default: "", index: true },
    firebaseUid: { type: String, default: "", sparse: true, index: true },
    address: { type: String, default: "" },
    avatar: { type: String, default: "" },
    role: { type: String, default: "delivery_agent" },
    employeeId: { type: String, default: "" },
    vehicleType: { type: String, default: "" },
    vehicleNumber: { type: String, default: "" },
    currentLocation: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    availabilityStatus: {
      type: String,
      enum: ["available", "busy", "offline"],
      default: "offline",
    },
    isVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    suspendedAt: { type: Date },
    suspendedReason: { type: String },
    createdBySupervisor: {
      type: require("mongoose").Schema.Types.ObjectId,
      ref: "Supervisor",
      default: null,
    },
    assignedSupervisor: {
      type: require("mongoose").Schema.Types.ObjectId,
      ref: "Supervisor",
      default: null,
    },
  },
  { timestamps: true },
);

deliveryAgentSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    this.password = await bcrypt.hash(this.password, salt);

    return next();
  } catch (err) {
    return next(err);
  }
});

deliveryAgentSchema.methods.comparePassword = async function (
  candidatePassword,
) {
  return bcrypt.compare(candidatePassword, this.password);
};

deliveryAgentSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

const DeliveryAgent = mongoose.model("DeliveryAgent", deliveryAgentSchema);

module.exports = { DeliveryAgent };
