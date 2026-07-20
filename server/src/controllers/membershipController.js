const mongoose = require("mongoose");
const { MembershipPlan } = require("../models/MembershipPlan");
const { Payment } = require("../models/Payment");
const {
  createOrder,
  verifyPayment,
} = require("../services/paymentService");
const {
  createNotification,
} = require("../services/notificationService");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * GET /api/membership/plans
 * Public endpoint to list all active membership plans.
 */
const listPlans = async (_req, res, next) => {
  try {
    const plans = await MembershipPlan.find({ isActive: true }).sort({
      price: 1,
    });

    return res.status(200).json({
      success: true,
      message: "Membership plans fetched successfully",
      data: plans,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/membership/create-order
 * Protected endpoint to create a Razorpay order.
 */
const createMembershipOrder = async (req, res, next) => {
  try {
    const planId = req.body?.planId;

    if (!planId || !isValidObjectId(planId)) {
      return res.status(400).json({
        success: false,
        message: "Valid planId is required",
      });
    }

    const plan = await MembershipPlan.findOne({
      _id: planId,
      isActive: true,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found",
      });
    }

    // Prevent duplicate pending payments
    const existingPendingPayment = await Payment.findOne({
      user: req.user._id,
      status: "created",
    });

    if (existingPendingPayment) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a pending payment. Complete it before creating a new one.",
      });
    }

    const result = await createOrder(planId, req.user._id);

    return res.status(200).json({
      success: true,
      message: "Razorpay order created successfully",
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/membership/verify-payment
 * Protected endpoint to verify Razorpay payment.
 */
const verifyMembershipPayment = async (req, res, next) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body || {};

    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "razorpayOrderId, razorpayPaymentId and razorpaySignature are required",
      });
    }

    // Find payment record
    const payment = await Payment.findOne({
      razorpayOrderId,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    // Prevent duplicate verification
    if (payment.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment already verified",
      });
    }

    // Verify signature
    const isValid = await verifyPayment(
      razorpaySignature,
      razorpayOrderId,
      razorpayPaymentId
    );

    if (!isValid) {
      const { _id: failedPaymentId } = (await Payment.findOneAndUpdate(
        { razorpayOrderId },
        {
          razorpayPaymentId,
          status: "failed",
        },
        { new: true }
      )) || {};

      if (req.user?._id) {
        await createNotification({
          recipient: req.user._id,
          recipientModel: req.user.constructor.modelName,
          title: "Payment Failed",
          message:
            "Your membership payment failed. Please try again.",
          type: "payment_failed",
          metadata: {
            razorpayOrderId,
            razorpayPaymentId,
            paymentId: failedPaymentId,
          },
        });
      }

      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Load membership plan
    const plan = await MembershipPlan.findById(
      payment.membershipPlan
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found",
      });
    }

    // Update payment
    const updatedPayment = await Payment.findOneAndUpdate(
      { razorpayOrderId },
      {
        razorpayPaymentId,
        razorpaySignature,
        status: "paid",
        paidAt: new Date(),
      },
      { new: true }
    );

    // Dynamic user model (supports separate collections)
    const UserModel = req.user.constructor;

    // Extend active membership if applicable
    const now = new Date();

    const start =
      req.user.membershipEndDate &&
      new Date(req.user.membershipEndDate) > now
        ? new Date(req.user.membershipEndDate)
        : now;

    const end = new Date(start);
    end.setDate(
      end.getDate() + Number(plan.durationDays || 30)
    );

    // Update user membership
    const updatePayload = {
      membershipStatus: "member",
      membershipPlan: plan.name,
      membershipStartDate: start,
      membershipEndDate: end,
    };

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user._id,
      updatePayload,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    // Notifications
    await createNotification({
      recipient: req.user._id,
      recipientModel: req.user.constructor.modelName,
      title: "Membership Upgraded",
      message: `Your membership has been upgraded to ${plan.name}.`,
      type: "membership_upgraded",
      metadata: {
        planId: plan._id,
        paymentId: updatedPayment?._id,
        membershipStartDate: start,
        membershipEndDate: end,
      },
    });

    await createNotification({
      recipient: req.user._id,
      recipientModel: req.user.constructor.modelName,
      title: "Payment Successful",
      message: "Your payment was successful.",
      type: "payment_success",
      metadata: {
        razorpayOrderId,
        razorpayPaymentId,
        paymentId: updatedPayment?._id,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Payment verified and membership activated successfully",
      data: {
        payment: updatedPayment,
        user: updatedUser,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/membership/me
 * Protected endpoint to fetch current membership info.
 */
const getMyMembership = async (req, res, next) => {
  try {
    const UserModel = req.user.constructor;

    const user = await UserModel.findById(req.user._id).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Auto-calculate expired status
    let membershipStatus = user.membershipStatus;

    if (
      user.membershipEndDate &&
      new Date(user.membershipEndDate) < new Date()
    ) {
      membershipStatus = "expired";
    }

    // Get latest successful payment
    const latestPayment = await Payment.findOne({
      user: req.user._id,
      status: "paid",
    })
      .sort({ paidAt: -1 })
      .populate("membershipPlan");

    return res.status(200).json({
      success: true,
      message: "My membership fetched successfully",
      data: {
        membershipStatus,
        membershipPlan: user.membershipPlan || null,
        membershipStartDate: user.membershipStartDate,
        membershipEndDate: user.membershipEndDate,
        latestPayment,
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  listPlans,
  createMembershipOrder,
  verifyMembershipPayment,
  getMyMembership,
};