const express = require("express");
const { protect } = require("../middleware/guards");
const {
  sendOtp,
  verifyOtp,
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  logoutUser,
  getMe,
  updateProfile,
} = require("../controllers/authController");

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", logoutUser);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

module.exports = { authRouter: router };
