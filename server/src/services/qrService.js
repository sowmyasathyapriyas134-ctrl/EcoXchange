const crypto = require("crypto");
const QRCode = require("qrcode");
const { UserQRCode } = require("../models/UserQRCode");

/**
 * Generate a unique QR Identity for a permanent member.
 * Format: ECOX-USER-XXXXXXXX (e.g. ECOX-USER-A92F81D7)
 * Generates both Data URL (base64 PNG) and stores database record.
 */
const generateUserQR = async (userId) => {
  // Check if active QR already exists
  const existing = await UserQRCode.findOne({ userId, active: true });
  if (existing) {
    return existing;
  }

  // Generate unique 8-character hex string
  let qrCodeId;
  let isUnique = false;
  while (!isUnique) {
    const randomHex = crypto.randomBytes(4).toString("hex").toUpperCase();
    qrCodeId = `ECOX-USER-${randomHex}`;
    const collision = await UserQRCode.findOne({ qrCodeId });
    if (!collision) isUnique = true;
  }

  const qrData = JSON.stringify({
    type: "ecoxchange_user_qr",
    qrCodeId,
    userId: String(userId),
    issuedAt: new Date().toISOString(),
  });

  // Generate Base64 Data URL Image
  const qrImage = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: "H",
    margin: 2,
    color: {
      dark: "#059669", // Emerald green
      light: "#FFFFFF",
    },
    width: 300,
  });

  const userQr = await UserQRCode.create({
    userId,
    qrCodeId,
    qrData,
    qrImage,
    active: true,
  });

  return userQr;
};

module.exports = { generateUserQR };
