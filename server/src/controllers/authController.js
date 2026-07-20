const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { User } = require("../models/User");
const { Otp } = require("../models/Otp");
const { AuditLog } = require("../models/AuditLog");
const { generateToken } = require("../utils/generateToken");
const { findAccountByPhone, normalizePhone } = require("../utils/findAccountByPhone");
const { findUserByEmail } = require("../utils/findUserByEmail");

const generateOtp = () => {
  return process.env.OTP_BYPASS === "true"
    ? process.env.DEMO_OTP || "123456"
    : crypto.randomInt(100000, 999999).toString();
};

const sendOtp = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ success: false, message: "Phone number is required" });

    const normalized = normalizePhone(phoneNumber) || phoneNumber.trim();

    // Rate Limiting: Max 5 requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtps = await Otp.countDocuments({ phoneNumber: normalized, createdAt: { $gte: oneHourAgo } });
    if (recentOtps >= 5) {
      return res.status(429).json({ success: false, message: "Too many OTP requests. Please try again later." });
    }

    // Cooldown: 60 seconds
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentOtp = await Otp.findOne({ phoneNumber: normalized, createdAt: { $gte: oneMinuteAgo } });
    if (recentOtp) {
      return res.status(429).json({ success: false, message: "Please wait 60 seconds before requesting another OTP." });
    }

    const otpCode = generateOtp();
    await Otp.create({ phoneNumber: normalized, otp: otpCode });



    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      // Include OTP in response only if bypass is active for demo purposes
      otp: process.env.OTP_BYPASS === "true" ? otpCode : undefined,
    });
  } catch (err) {
    return next(err);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp) return res.status(400).json({ success: false, message: "Phone number and OTP are required" });

    const normalized = normalizePhone(phoneNumber) || phoneNumber.trim();
    
    const otpRecord = await Otp.findOne({ phoneNumber: normalized }).sort({ createdAt: -1 });
    if (!otpRecord) return res.status(400).json({ success: false, message: "OTP expired or not found" });

    if (otpRecord.attempts >= 3) {
      return res.status(400).json({ success: false, message: "Maximum verification attempts reached. Request a new OTP." });
    }

    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // OTP verified successfully
    await Otp.deleteMany({ phoneNumber: normalized }); // clear all OTPs for this phone

    const account = await findAccountByPhone(normalized);
    if (!account) {
      return res.status(200).json({
        success: true,
        message: "OTP verified. Proceed to registration.",
        isNewUser: true,
      });
    }

    const { doc, modelName } = account;
    
    // Log in existing user
    const token = generateToken(doc);
    await AuditLog.create({ action: "login_otp", user: doc._id, ipAddress: req.ip });

    const userObj = doc.toJSON ? doc.toJSON() : doc;
    delete userObj.password;

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      isNewUser: false,
      token,
      data: userObj,
      modelName,
    });
  } catch (err) {
    return next(err);
  }
};

const registerUser = async (req, res, next) => {
  try {
    const { fullName, email, password, address, phoneNumber, role, location } = req.body;
    const normalized = normalizePhone(phoneNumber) || phoneNumber;

    const existingEmail = await findUserByEmail(email);
    if (existingEmail) return res.status(400).json({ success: false, message: "Email already registered" });

    const existingPhone = await findAccountByPhone(normalized);
    if (existingPhone) return res.status(400).json({ success: false, message: "Phone number already registered" });

    const mappedRole = role === "recycler" ? "recycler" : "citizen"; // Allow some roles or default to citizen

    const user = await User.create({
      fullName,
      email,
      password,
      phoneNumber: normalized,
      address: address || (location?.formattedAddress) || "",
      location: location || {},
      role: mappedRole,
      membershipStatus: "trial",
      streak: 0,
      isPhoneVerified: true, // Auto-verified during OTP flow
    });

    const token = generateToken(user);
    await AuditLog.create({ action: "registration", user: user._id, ipAddress: req.ip });

    const userObj = user.toJSON();
    delete userObj.password;

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      data: userObj,
      modelName: "User"
    });
  } catch (err) {
    return next(err);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required" });

    const account = await findUserByEmail(email);
    if (!account) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const accountWithPassword = await account.constructor.findById(account._id).select("+password");
    if (!accountWithPassword) return res.status(401).json({ success: false, message: "Invalid credentials" });

    if (accountWithPassword.isSuspended) return res.status(403).json({ success: false, message: "Account suspended" });

    const isMatch = await accountWithPassword.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = generateToken(accountWithPassword);
    await AuditLog.create({ action: "login_password", user: account._id, ipAddress: req.ip });

    const userObj = account.toJSON ? account.toJSON() : account;
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

// forgotPassword reuses the same OTP flow as login
const forgotPassword = sendOtp;

const resetPassword = async (req, res, next) => {
  try {
    const { phoneNumber, otp, newPassword } = req.body;
    if (!phoneNumber || !otp || !newPassword) return res.status(400).json({ success: false, message: "Missing fields" });

    const normalized = normalizePhone(phoneNumber) || phoneNumber.trim();
    
    const otpRecord = await Otp.findOne({ phoneNumber: normalized }).sort({ createdAt: -1 });
    if (!otpRecord) return res.status(400).json({ success: false, message: "OTP expired or not found" });

    if (otpRecord.attempts >= 3) return res.status(400).json({ success: false, message: "Max attempts reached" });

    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const account = await findAccountByPhone(normalized);
    if (!account) return res.status(404).json({ success: false, message: "User not found" });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await account.doc.constructor.findByIdAndUpdate(account.doc._id, { password: hashedPassword });
    await Otp.deleteMany({ phoneNumber: normalized });
    
    await AuditLog.create({ action: "password_reset", user: account.doc._id, ipAddress: req.ip });

    return res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (err) {
    return next(err);
  }
};

const logoutUser = async (req, res) => {
  return res.status(200).json({ success: true, message: "Logged out successfully" });
};

const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Current user fetched successfully",
    data: { user: req.user, modelName: req.modelName },
  });
};

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
