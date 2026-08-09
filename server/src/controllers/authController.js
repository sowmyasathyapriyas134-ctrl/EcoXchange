const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { User } = require("../models/User");
const { Otp } = require("../models/Otp");
const { AuditLog } = require("../models/AuditLog");
const { PasswordReset } = require("../models/PasswordReset");
const { Wallet } = require("../models/Wallet");
const { generateToken } = require("../utils/generateToken");
const { findAccountByPhone, normalizePhone } = require("../utils/findAccountByPhone");
const { findUserByEmail } = require("../utils/findUserByEmail");
const { sendPasswordResetEmail } = require("../services/emailService");
const { otpService } = require("../services/otpService");

// OTP generation is handled by otpService (see services/otpService.js)

// ---------------------------------------------------------------------------
// Password complexity validator
// ---------------------------------------------------------------------------
function isStrongPassword(password) {
  // Min 8 chars, uppercase, lowercase, digit, special char
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]).{8,}$/.test(
    password
  );
}

// ---------------------------------------------------------------------------
// Send OTP — for login only. Phone MUST already be registered.
// ---------------------------------------------------------------------------
const sendOtp = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber)
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });

    const normalized = normalizePhone(phoneNumber) || phoneNumber.trim();

    // Enforce: phone must be registered (login-only OTP)
    const account = await findAccountByPhone(normalized);
    if (!account) {
      return res.status(404).json({
        success: false,
        message:
          "This phone number is not registered. Please create an account first.",
      });
    }

    // Rate Limiting: Max 5 requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtps = await Otp.countDocuments({
      phoneNumber: normalized,
      createdAt: { $gte: oneHourAgo },
    });
    if (recentOtps >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many OTP requests. Please try again later.",
      });
    }

    // Cooldown: 60 seconds
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentOtp = await Otp.findOne({
      phoneNumber: normalized,
      createdAt: { $gte: oneMinuteAgo },
    });
    if (recentOtp) {
      return res.status(429).json({
        success: false,
        message: "Please wait 60 seconds before requesting another OTP.",
      });
    }

    const { otp: otpCode, devOtp } = await otpService.send(normalized);
    await Otp.create({ phoneNumber: normalized, otp: otpCode });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      // devOtp is defined only in non-production environments
      otp: devOtp,
    });
  } catch (err) {
    return next(err);
  }
};

// ---------------------------------------------------------------------------
// Verify OTP — login flow. Fails if phone not registered.
// ---------------------------------------------------------------------------
const verifyOtp = async (req, res, next) => {
  try {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp)
      return res
        .status(400)
        .json({ success: false, message: "Phone number and OTP are required" });

    const normalized = normalizePhone(phoneNumber) || phoneNumber.trim();

    const otpRecord = await Otp.findOne({ phoneNumber: normalized }).sort({
      createdAt: -1,
    });
    if (!otpRecord)
      return res
        .status(400)
        .json({ success: false, message: "OTP expired or not found" });

    if (otpRecord.attempts >= 3) {
      return res.status(400).json({
        success: false,
        message: "Maximum verification attempts reached. Request a new OTP.",
      });
    }

    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // OTP verified — clear all OTPs for this phone
    await Otp.deleteMany({ phoneNumber: normalized });

    const account = await findAccountByPhone(normalized);
    if (!account) {
      // Should not happen since sendOtp checks this, but guard anyway
      return res.status(404).json({
        success: false,
        message:
          "This phone number is not registered. Please create an account first.",
      });
    }

    const { doc, modelName } = account;

    if (doc.isSuspended) {
      return res
        .status(403)
        .json({ success: false, message: "Account suspended" });
    }

    const token = generateToken(doc);
    await AuditLog.create({
      action: "login_otp",
      user: doc._id,
      ipAddress: req.ip,
    });

    const userObj = doc.toJSON ? doc.toJSON() : { ...doc };
    delete userObj.password;

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      data: userObj,
      modelName,
    });
  } catch (err) {
    return next(err);
  }
};

// ---------------------------------------------------------------------------
// Register — citizen only, auto-creates Wallet
// ---------------------------------------------------------------------------
const registerUser = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      password,
      address,
      phoneNumber,
      city,
      state,
      pincode,
    } = req.body;

    if (!fullName || !email || !password || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, phone number, and password are required",
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character",
      });
    }

    const normalized = normalizePhone(phoneNumber) || phoneNumber;

    const existingEmail = await findUserByEmail(email);
    if (existingEmail)
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });

    const existingPhone = await findAccountByPhone(normalized);
    if (existingPhone)
      return res
        .status(400)
        .json({ success: false, message: "Phone number already registered" });

    const user = await User.create({
      fullName,
      email,
      password,
      phoneNumber: normalized,
      address: address || "",
      location: {
        city: city || "",
        state: state || "",
        postalCode: pincode || "",
      },
      role: "citizen", // Always citizen — never allow role selection from public signup
      membershipStatus: "trial",
      streak: 0,
    });

    // Auto-create Wallet
    await Wallet.create({ ownerId: user._id, ownerModel: "User" });

    const token = generateToken(user);
    await AuditLog.create({
      action: "registration",
      user: user._id,
      ipAddress: req.ip,
    });

    const userObj = user.toJSON();
    delete userObj.password;

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      data: userObj,
      modelName: "User",
    });
  } catch (err) {
    return next(err);
  }
};

// ---------------------------------------------------------------------------
// Login — email + password (all collections)
// ---------------------------------------------------------------------------
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });

    const account = await findUserByEmail(email);
    if (!account)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const accountWithPassword = await account.constructor
      .findById(account._id)
      .select("+password");
    if (!accountWithPassword)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    if (accountWithPassword.isSuspended)
      return res
        .status(403)
        .json({ success: false, message: "Account suspended" });

    const isMatch = await accountWithPassword.comparePassword(password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const token = generateToken(accountWithPassword);
    await AuditLog.create({
      action: "login_password",
      user: account._id,
      ipAddress: req.ip,
    });

    const userObj = account.toJSON ? account.toJSON() : { ...account };
    delete userObj.password;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: userObj,
      modelName: account.constructor.modelName,
    });
  } catch (err) {
    return next(err);
  }
};

// ---------------------------------------------------------------------------
// Forgot Password — email token based (replaces OTP-reuse approach)
// ---------------------------------------------------------------------------
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });

    // Rate limit: 3 requests per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRequests = await PasswordReset.countDocuments({
      email: email.toLowerCase().trim(),
      createdAt: { $gte: oneHourAgo },
    });
    if (recentRequests >= 3) {
      return res.status(429).json({
        success: false,
        message:
          "Too many password reset requests. Please try again in an hour.",
      });
    }

    // Always respond 200 to prevent email enumeration
    const account = await findUserByEmail(email);

    if (account) {
      // Generate secure random token
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await PasswordReset.create({
        email: email.toLowerCase().trim(),
        tokenHash,
        expiresAt,
        used: false,
      });

      const clientUrl =
        process.env.CLIENT_URL || "http://localhost:5173";
      const resetUrl = `${clientUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(
        email.toLowerCase().trim()
      )}`;

      await sendPasswordResetEmail(email, rawToken, resetUrl);
    }

    return res.status(200).json({
      success: true,
      message:
        "If this email is registered, you will receive a password reset link shortly.",
    });
  } catch (err) {
    return next(err);
  }
};

// ---------------------------------------------------------------------------
// Reset Password — validates email token, updates password
// ---------------------------------------------------------------------------
const resetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword)
      return res
        .status(400)
        .json({ success: false, message: "Email, token, and new password are required" });

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const resetRecord = await PasswordReset.findOne({
      email: email.toLowerCase().trim(),
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset link. Please request a new one.",
      });
    }

    const account = await findUserByEmail(email);
    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Hash new password directly (bypasses pre-save hook via findByIdAndUpdate)
    // We use save() on the document to trigger the pre-save hook instead
    const accountWithDoc = await account.constructor
      .findById(account._id)
      .select("+password");
    accountWithDoc.password = newPassword;
    await accountWithDoc.save(); // triggers bcrypt pre-save hook

    // Mark token as used
    resetRecord.used = true;
    await resetRecord.save();

    // Invalidate all other reset tokens for this email
    await PasswordReset.deleteMany({
      email: email.toLowerCase().trim(),
      _id: { $ne: resetRecord._id },
    });

    await AuditLog.create({
      action: "password_reset",
      user: account._id,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (err) {
    return next(err);
  }
};

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------
const logoutUser = async (req, res) => {
  return res.status(200).json({ success: true, message: "Logged out successfully" });
};

// ---------------------------------------------------------------------------
// Get current user (me)
// ---------------------------------------------------------------------------
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Current user fetched successfully",
    data: { user: req.user, modelName: req.modelName },
  });
};

// ---------------------------------------------------------------------------
// Update profile
// ---------------------------------------------------------------------------
const updateProfile = async (req, res, next) => {
  try {
    const updates = {};
    const { fullName, address, avatar } = req.body;

    if (fullName !== undefined) updates.fullName = fullName;
    if (address !== undefined) updates.address = address;
    if (avatar !== undefined) updates.avatar = avatar;

    const updated = await req.user.constructor
      .findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
      .select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  logoutUser,
  getMe,
  updateProfile,
};
