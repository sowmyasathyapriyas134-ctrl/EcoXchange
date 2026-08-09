const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
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
    phoneNumber: { type: String, required: true, unique: true },
    firebaseUid: { type: String, default: "", index: true, sparse: true },
    qrCodeData: { type: String, default: "" },
    address: { type: String, default: "" },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      area: { type: String },
      city: { type: String },
      district: { type: String },
      state: { type: String },
      postalCode: { type: String },
      formattedAddress: { type: String },
    },
    avatar: { type: String, default: "" },
    role: {
      type: String,
      enum: ["citizen", "recycler", "supervisor", "admin", "vendor"],
      default: "citizen",
    },
    ecoPoints: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    membershipStatus: {
      type: String,
      enum: ["trial", "member"],
      default: "trial",
    },
    isPhoneVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    suspendedAt: { type: Date },
    suspendedReason: { type: String },

    membershipStartDate: { type: Date },
    membershipEndDate: { type: Date },
    membershipPlan: { type: String, default: "" },
    membershipEligibility: {
      isEligible: { type: Boolean, default: false },
      eligibleAt: { type: Date },
    },
    membershipActivatedAt: { type: Date },
    membershipPaymentId: { type: String, default: "" },
    binSize: { type: String, enum: ["small", "medium", "large", ""], default: "" },
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
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

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);

module.exports = { User };
