const { User } = require("../models/User");
const { Order } = require("../models/Order");
const { Product } = require("../models/Product");
const { TrialSubmission } = require("../models/TrialSubmission");

const getCitizenDashboard = async (req, res, next) => {
  try {
    const orders = await Order.countDocuments({ user: req.user._id });
    const submissions = await TrialSubmission.countDocuments({ user: req.user._id });
    
    return res.status(200).json({
      success: true,
      data: {
        totalOrders: orders,
        totalSubmissions: submissions,
        ecoPoints: req.user.ecoPoints || 0,
        streak: req.user.streak || 0,
        membershipStatus: req.user.membershipStatus
      }
    });
  } catch (err) {
    return next(err);
  }
};

const getRecyclerDashboard = async (req, res, next) => {
  try {
    const { Pickup } = require("../models/Pickup");
    const { RecyclerPayment } = require("../models/RecyclerPayment");
    
    const products = await Product.countDocuments({ recycler: req.user._id });
    const activeProducts = await Product.countDocuments({ recycler: req.user._id, isActive: true });
    
    // Recycler metrics
    const [incomingWaste, processingQueue, completedBatches, payments] = await Promise.all([
      Pickup.countDocuments({ status: "completed", recyclingStatus: "pending" }),
      Pickup.countDocuments({ recycler: req.user._id, recyclingStatus: "accepted" }),
      Pickup.countDocuments({ recycler: req.user._id, recyclingStatus: "processed" }),
      RecyclerPayment.find({ recycler: req.user._id }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);
    const totalWeightProcessed = payments.reduce((sum, p) => sum + Number(p.weight || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        totalProductsListed: products,
        activeProducts,
        incomingWaste,
        processingQueue,
        completedBatches,
        totalRevenue,
        totalWeightProcessed,
      }
    });
  } catch (err) {
    return next(err);
  }
};

const getSupervisorDashboard = async (req, res, next) => {
  try {
    const { Pickup } = require("../models/Pickup");
    const { DeliveryAgent } = require("../models/DeliveryAgent");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      pendingVerifications,
      approvedByMe,
      todayCollections,
      assignedPickups,
      activeAgents,
    ] = await Promise.all([
      Pickup.countDocuments({ status: "completed", verificationStatus: "pending" }),
      Pickup.countDocuments({ verificationStatus: "verified", verifiedBy: req.user._id }),
      Pickup.countDocuments({ createdAt: { $gte: today } }),
      Pickup.countDocuments({ status: { $in: ["assigned", "accepted", "in_progress"] } }),
      DeliveryAgent.countDocuments({ availabilityStatus: { $in: ["available", "busy"] } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        pendingVerifications,
        approvedByMe,
        todayCollections,
        assignedPickups,
        activeAgents,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const getAdminDashboard = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalOrders = await Order.countDocuments({});
    const totalProducts = await Product.countDocuments({});
    
    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalOrders,
        totalProducts,
      }
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getCitizenDashboard,
  getRecyclerDashboard,
  getSupervisorDashboard,
  getAdminDashboard
};
