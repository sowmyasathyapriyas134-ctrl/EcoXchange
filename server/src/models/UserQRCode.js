const mongoose = require("mongoose");

const userQRCodeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    qrCodeId: {
      type: String,
      required: true,
      unique: true,
    },
    qrData: {
      type: String,
      required: true,
    },
    qrImage: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const UserQRCode = mongoose.model("UserQRCode", userQRCodeSchema);

module.exports = { UserQRCode };
