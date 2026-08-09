const crypto = require("crypto");
const { User } = require("../models/User");
const { MembershipPurchase } = require("../models/MembershipPurchase");
const { UserToolkit } = require("../models/UserToolkit");
const { UserQRCode } = require("../models/UserQRCode");
const { createRazorpayOrder, verifyPayment } = require("../services/paymentService");
const { generateUserQR } = require("../services/qrService");

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/membership/create-order
// Requires: JWT auth (req.user), body: { binSize: "small" | "medium" | "large" }
// ─────────────────────────────────────────────────────────────────────────────
const createMembershipOrder = async (req, res, next) => {
  try {
    const { binSize } = req.body;

    if (!binSize || !["small", "medium", "large"].includes(binSize)) {
      return sendError(res, 400, "Valid binSize (small, medium, large) is required");
    }

    const user = await User.findById(req.user._id);
    if (!user) return sendError(res, 404, "User not found");

    // Security Check 1: Prevent duplicate permanent membership
    if (user.membershipStatus === "member") {
      return sendError(res, 400, "You are already a Permanent Member!");
    }

    // Security Check 2: Verify Trial streak eligibility
    const isEligible =
      user.membershipEligibility?.isEligible || user.streak >= 5;
    if (!isEligible) {
      return sendError(
        res,
        400,
        "Trial not complete. You must complete your 5-day streak before upgrading."
      );
    }

    const amountInRupees = 300;
    const receipt = `mb_upg_${user._id}_${Date.now()}`;

    // Create Razorpay Order or fallback demo order ID
    let razorpayOrderId = `demo_ord_${crypto.randomBytes(8).toString("hex")}`;
    try {
      const razorpayOrder = await createRazorpayOrder(amountInRupees, receipt);
      if (razorpayOrder && razorpayOrder.id) {
        razorpayOrderId = razorpayOrder.id;
      }
    } catch (e) {
      console.log("[Razorpay Order] Using fallback order ID:", razorpayOrderId);
    }

    const purchase = await MembershipPurchase.create({
      user: user._id,
      plan: "permanent",
      amount: amountInRupees,
      binSize,
      razorpayOrderId,
      paymentStatus: "pending",
    });

    return res.status(200).json({
      success: true,
      data: {
        orderId: razorpayOrderId,
        purchaseId: purchase._id,
        amount: amountInRupees * 100, // paise for Razorpay frontend SDK
        currency: "INR",
        key: process.env.RAZORPAY_KEY_ID || "rzp_test_demo_key",
        binSize,
      },
    });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/membership/verify-payment
// Body: { purchaseId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
// ─────────────────────────────────────────────────────────────────────────────
const verifyMembershipPayment = async (req, res, next) => {
  try {
    const {
      purchaseId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    const purchase = await MembershipPurchase.findById(purchaseId);
    if (!purchase) return sendError(res, 404, "Purchase record not found");

    if (purchase.paymentStatus === "success") {
      return sendError(res, 400, "Payment has already been verified and processed");
    }

    // Enforce strict payment signature verification in production
    const isProduction = process.env.NODE_ENV === "production";
    const isSecretSet = Boolean(process.env.RAZORPAY_KEY_SECRET);

    if (isProduction || isSecretSet) {
      if (!razorpaySignature || !razorpayOrderId || !razorpayPaymentId) {
        purchase.paymentStatus = "failed";
        await purchase.save();
        return sendError(res, 400, "Missing payment signature or order parameters");
      }

      const isValid = await verifyPayment(
        razorpaySignature,
        razorpayOrderId,
        razorpayPaymentId
      );
      if (!isValid) {
        purchase.paymentStatus = "failed";
        await purchase.save();
        return sendError(res, 400, "Invalid payment signature verification failed");
      }
    }

    // Update Purchase status
    purchase.razorpayPaymentId = razorpayPaymentId || `pay_${Date.now()}`;
    purchase.razorpaySignature = razorpaySignature || "demo_sig";
    purchase.paymentStatus = "success";
    await purchase.save();

    // 1. Update User Document
    const user = await User.findById(purchase.user);
    user.membershipStatus = "member";
    user.membershipPlan = "permanent";
    user.binSize = purchase.binSize;
    user.membershipActivatedAt = new Date();
    user.membershipPaymentId = purchase.razorpayPaymentId;
    await user.save();

    // 2. Allocate Toolkit automatically
    let toolkit = await UserToolkit.findOne({ userId: user._id });
    if (!toolkit) {
      toolkit = await UserToolkit.create({
        userId: user._id,
        dustbins: {
          count: 3,
          size: purchase.binSize,
          delivered: false,
        },
        covers: { quantity: 100 },
        qrStickers: { quantity: 100 },
        deliveryStatus: "processing",
      });
    }

    // 3. Generate Unique QR Identity
    const qrCode = await generateUserQR(user._id);

    return res.status(200).json({
      success: true,
      message: "Membership upgraded to Permanent successfully!",
      data: {
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          membershipStatus: user.membershipStatus,
          membershipPlan: user.membershipPlan,
          binSize: user.binSize,
        },
        toolkit,
        qrCode,
      },
    });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/membership/status
// Returns eligibility, status, bin size, toolkit & QR info for current user
// ─────────────────────────────────────────────────────────────────────────────
const getMembershipStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return sendError(res, 404, "User not found");

    // Auto-update eligibility if streak >= 5
    if (user.streak >= 5 && !user.membershipEligibility?.isEligible) {
      user.membershipEligibility = {
        isEligible: true,
        eligibleAt: new Date(),
      };
      await user.save();
    }

    const [toolkit, qrCode, lastPurchase] = await Promise.all([
      UserToolkit.findOne({ userId: user._id }).lean(),
      UserQRCode.findOne({ userId: user._id, active: true }).lean(),
      MembershipPurchase.findOne({ user: user._id, paymentStatus: "success" })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        membershipStatus: user.membershipStatus,
        membershipPlan: user.membershipPlan,
        streak: user.streak,
        isEligible: Boolean(user.membershipEligibility?.isEligible || user.streak >= 5),
        eligibleAt: user.membershipEligibility?.eligibleAt || null,
        binSize: user.binSize || null,
        membershipActivatedAt: user.membershipActivatedAt || null,
        toolkit: toolkit || null,
        qrCode: qrCode || null,
        lastPurchase: lastPurchase || null,
      },
    });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/membership/toolkit
// ─────────────────────────────────────────────────────────────────────────────
const getUserToolkit = async (req, res, next) => {
  try {
    const toolkit = await UserToolkit.findOne({ userId: req.user._id });
    if (!toolkit) {
      return sendError(res, 404, "No toolkit assigned to this account");
    }
    return res.status(200).json({ success: true, data: toolkit });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/membership/qrcode
// ─────────────────────────────────────────────────────────────────────────────
const getUserQRCode = async (req, res, next) => {
  try {
    const qrCode = await UserQRCode.findOne({ userId: req.user._id, active: true });
    if (!qrCode) {
      return sendError(res, 404, "No active QR Identity found for this account");
    }
    return res.status(200).json({ success: true, data: qrCode });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Admin Controller Functions
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/memberships — List all purchases & toolkit/QR statuses
const getAdminMemberships = async (req, res, next) => {
  try {
    const purchases = await MembershipPurchase.find({})
      .populate("user", "fullName email phoneNumber address streak membershipStatus")
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await Promise.all(
      purchases.map(async (p) => {
        if (!p.user) return p;
        const [toolkit, qrCode] = await Promise.all([
          UserToolkit.findOne({ userId: p.user._id }).lean(),
          UserQRCode.findOne({ userId: p.user._id, active: true }).lean(),
        ]);
        return { ...p, toolkit, qrCode };
      })
    );

    return res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    return next(err);
  }
};

// PATCH /api/admin/membership/:id/toolkit-status
const updateAdminToolkitStatus = async (req, res, next) => {
  try {
    const { id } = req.params; // toolkit ID or user ID
    const { deliveryStatus, delivered } = req.body;

    let toolkit = await UserToolkit.findById(id);
    if (!toolkit) {
      toolkit = await UserToolkit.findOne({ userId: id });
    }
    if (!toolkit) return sendError(res, 404, "Toolkit record not found");

    if (deliveryStatus) toolkit.deliveryStatus = deliveryStatus;
    if (delivered !== undefined) toolkit.dustbins.delivered = Boolean(delivered);
    if (deliveryStatus === "delivered") toolkit.dustbins.delivered = true;

    await toolkit.save();

    return res.status(200).json({
      success: true,
      message: "Toolkit status updated successfully",
      data: toolkit,
    });
  } catch (err) {
    return next(err);
  }
};

// POST /api/admin/membership/:userId/regenerate-qr — Only regenerates if inactive or lost
const regenerateUserQRAdmin = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return sendError(res, 404, "User not found");

    // Deactivate existing QR
    await UserQRCode.updateMany({ userId }, { active: false });

    // Generate fresh new QR
    const newQr = await generateUserQR(userId);

    return res.status(200).json({
      success: true,
      message: "New QR identity generated successfully",
      data: newQr,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createMembershipOrder,
  verifyMembershipPayment,
  getMembershipStatus,
  getUserToolkit,
  getUserQRCode,
  getAdminMemberships,
  updateAdminToolkitStatus,
  regenerateUserQRAdmin,
};