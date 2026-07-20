const mongoose = require("mongoose");
const { Pickup } = require("../models/Pickup");
const { RecyclerPayment } = require("../models/RecyclerPayment");
const { createNotification } = require("../services/notificationService");
const { uploadToCloudinary } = require("../config/cloudinary");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const RATES = {
  plastic: 10,
  paper: 5,
  metal: 20,
  glass: 8,
  organic: 3,
  ewaste: 25,
};

const getAvailablePickups = async (req, res, next) => {
  try {
    // Recyclers should pick from completed pickups that are not assigned
    const pickups = await Pickup.find({
      status: "completed",
      recyclingStatus: "pending",
    })
      .sort({ scheduledDate: 1 })
      .select("_id wasteType actualWeight user scheduledDate address");

    return res.status(200).json({
      success: true,
      message: "Available pickups fetched successfully",
      data: pickups,
    });
  } catch (err) {
    return next(err);
  }
};

const acceptPickupForRecycling = async (req, res, next) => {
  try {
    const { pickupId } = req.params;
    if (!isValidObjectId(pickupId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid pickupId" });
    }

    const pickup = await Pickup.findById(pickupId);
    if (!pickup) {
      return res
        .status(404)
        .json({ success: false, message: "Pickup not found" });
    }

    if (pickup.status !== "completed") {
      return res
        .status(400)
        .json({ success: false, message: "Pickup is not completed" });
    }

    if (pickup.recyclingStatus !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "Pickup already accepted/processed" });
    }

    pickup.recycler = req.user._id;
    pickup.recyclingStatus = "accepted";
    await pickup.save();

    return res.status(200).json({
      success: true,
      message: "Pickup accepted for recycling",
      data: pickup,
    });
  } catch (err) {
    return next(err);
  }
};

const processPickup = async (req, res, next) => {
  try {
    const { pickupId } = req.params;
    const { recycledWeight, processingNotes } = req.body || {};

    if (!isValidObjectId(pickupId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid pickupId" });
    }
    if (recycledWeight === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "recycledWeight is required" });
    }

    const pickup = await Pickup.findById(pickupId);
    if (!pickup) {
      return res
        .status(404)
        .json({ success: false, message: "Pickup not found" });
    }

    if (
      !pickup.recycler ||
      pickup.recycler.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to process this pickup",
        });
    }

    if (pickup.recyclingStatus !== "accepted") {
      return res
        .status(400)
        .json({ success: false, message: "Pickup not in accepted state" });
    }

    let certificateUrl = pickup.recyclingCertificate || "";
    if (req.file) {
      try {
        const uploadRes = await uploadToCloudinary(req.file.buffer, {
          folder: "ecoexchange/recycling-certificates",
        });
        certificateUrl = uploadRes?.secure_url || certificateUrl;
      } catch (e) {
        return res
          .status(500)
          .json({ success: false, message: "Certificate upload failed" });
      }
    }

    pickup.recycledWeight = recycledWeight;
    pickup.processingDate = new Date();
    pickup.processingNotes = processingNotes || "";
    pickup.recyclingCertificate = certificateUrl;
    pickup.recyclingStatus = "processed";

    await pickup.save();

    return res.status(200).json({
      success: true,
      message: "Pickup processed successfully",
      data: pickup,
    });
  } catch (err) {
    return next(err);
  }
};

const createRecyclerPayment = async (req, res, next) => {
  try {
    const { pickupId } = req.params;
    if (!isValidObjectId(pickupId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid pickupId" });
    }

    const pickup = await Pickup.findById(pickupId);
    if (!pickup) {
      return res
        .status(404)
        .json({ success: false, message: "Pickup not found" });
    }

    if (
      !pickup.recycler ||
      pickup.recycler.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    if (pickup.recyclingStatus !== "processed") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Pickup must be processed before payment",
        });
    }

    const memberId = pickup.user;
    const wasteType = pickup.wasteType;
    const ratePerKg = RATES[wasteType];

    if (!ratePerKg) {
      return res
        .status(400)
        .json({ success: false, message: "No rate configured for wasteType" });
    }

    const weight = Number(pickup.recycledWeight || 0);
    const totalAmount = weight * ratePerKg;

    const payment = await RecyclerPayment.create({
      pickup: pickup._id,
      member: memberId,
      recycler: req.user._id,
      wasteType,
      weight,
      ratePerKg,
      totalAmount,
      status: "paid",
      paidAt: new Date(),
      notes: "Recycler payout for processed waste",
    });

    // Notify member
    await createNotification({
      recipient: memberId,
      recipientModel: "User",
      title: "Recycling payout",
      message: `You received ₹${totalAmount} for ${wasteType} waste processed by recycler.`,
      type: "system_alert",
      metadata: {
        pickupId: pickup._id,
        paymentId: payment._id,
        wasteType,
        weight,
        totalAmount,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Payment created and member notified",
      data: payment,
    });
  } catch (err) {
    return next(err);
  }
};

const getMyProcessedPickups = async (req, res, next) => {
  try {
    const pickups = await Pickup.find({
      recycler: req.user._id,
      recyclingStatus: "processed",
    }).sort({ processingDate: -1 });

    return res.status(200).json({
      success: true,
      message: "Processed pickups fetched successfully",
      data: pickups,
    });
  } catch (err) {
    return next(err);
  }
};

const getRecyclerPayments = async (req, res, next) => {
  try {
    const payments = await RecyclerPayment.find(
      req.user.role === "recycler" ? { recycler: req.user._id } : {},
    ).sort({ paidAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Recycler payments fetched successfully",
      data: payments,
    });
  } catch (err) {
    return next(err);
  }
};

const getRecyclerReport = async (req, res, next) => {
  try {
    const match =
      req.user.role === "recycler" ? { recycler: req.user._id } : {};

    const payments = await RecyclerPayment.find(match);

    const totalProcessedPickups = await Pickup.countDocuments({
      ...(req.user.role === "recycler" ? { recycler: req.user._id } : {}),
      recyclingStatus: "processed",
    });

    const totalRecycledWeight = payments.reduce(
      (sum, p) => sum + Number(p.weight || 0),
      0,
    );
    const totalPaidToMembers = payments.reduce(
      (sum, p) => sum + Number(p.totalAmount || 0),
      0,
    );

    return res.status(200).json({
      success: true,
      data: {
        totalProcessedPickups,
        totalRecycledWeight,
        totalPaidToMembers,
        // Marketplace aggregation is handled in the marketplace module
        totalProductsListed: 0,
        totalSales: 0,
        estimatedProfit: 0,
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getAvailablePickups,
  acceptPickupForRecycling,
  processPickup,
  createRecyclerPayment,
  getMyProcessedPickups,
  getRecyclerPayments,
  getRecyclerReport,
};
