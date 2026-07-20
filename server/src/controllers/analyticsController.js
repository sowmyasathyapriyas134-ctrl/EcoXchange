const mongoose = require("mongoose");
const { User } = require("../models/User");
const { Pickup } = require("../models/Pickup");
const { RewardRedemption } = require("../models/RewardRedemption");
const { Payment } = require("../models/Payment");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper to safely count documents
const count = async (model, query) => model.countDocuments(query);

const adminOverview = async (_req, res, next) => {
  try {
    const [
      totalUsers,
      totalMembers,
      totalTrialMembers,
      totalSupervisors,
      totalAgents,
      totalRecyclers,
    ] = await Promise.all([
      count(User, {}),
      count(User, { role: "member" }),
      count(User, { role: "trial_member" }),
      // other models exist but are not required for core metrics in this phase
      Promise.resolve(0),
      Promise.resolve(0),
      Promise.resolve(0),
    ]);

    const pickupsAgg = await Pickup.aggregate([
      {
        $group: {
          _id: null,
          totalPickups: { $sum: 1 },
          completedPickups: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          pendingPickups: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          totalWasteCollected: {
            $sum: {
              $cond: [
                { $eq: ["$status", "completed"] },
                { $ifNull: ["$actualWeight", 0] },
                0,
              ],
            },
          },
          totalEcoPointsAwarded: {
            $sum: {
              $cond: [
                { $eq: ["$status", "completed"] },
                { $ifNull: ["$ecoPointsAwarded", 0] },
                0,
              ],
            },
          },
        },
      },
    ]);

    const wasteAgg = pickupsAgg[0] || {
      totalPickups: 0,
      completedPickups: 0,
      pendingPickups: 0,
      totalWasteCollected: 0,
      totalEcoPointsAwarded: 0,
    };

    const totalRevenue = await Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, sum: { $sum: "$amount" } } },
    ]);

    const revenue = totalRevenue[0]?.sum || 0;

    return res.status(200).json({
      success: true,
      message: "Analytics overview fetched successfully",
      data: {
        totalUsers,
        totalMembers,
        totalTrialMembers,
        totalSupervisors,
        totalAgents,
        totalRecyclers,
        totalPickups: wasteAgg.totalPickups,
        completedPickups: wasteAgg.completedPickups,
        pendingPickups: wasteAgg.pendingPickups,
        totalWasteCollected: wasteAgg.totalWasteCollected,
        totalEcoPointsAwarded: wasteAgg.totalEcoPointsAwarded,
        totalRevenue: revenue / 100, // paise -> INR
      },
    });
  } catch (err) {
    return next(err);
  }
};

const wasteByType = async (_req, res, next) => {
  try {
    const results = await Pickup.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$wasteType",
          totalWeight: { $sum: { $ifNull: ["$actualWeight", 0] } },
          pickups: { $sum: 1 },
        },
      },
      { $sort: { pickups: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      message: "Waste by type fetched successfully",
      data: results,
    });
  } catch (err) {
    return next(err);
  }
};

const monthlyTrends = async (_req, res, next) => {
  try {
    const results = await Pickup.aggregate([
      {
        $match: {
          status: {
            $in: [
              "completed",
              "pending",
              "approved",
              "rejected",
              "assigned",
              "accepted",
              "in_progress",
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          pickups: { $sum: 1 },
          completedPickups: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    return res.status(200).json({
      success: true,
      message: "Monthly trends fetched successfully",
      data: results,
    });
  } catch (err) {
    return next(err);
  }
};

const supervisorOverview = async (req, res, next) => {
  try {
    const memberPickups = await Pickup.aggregate([
      {
        $match: {
          supervisor: new mongoose.Types.ObjectId(req.user._id),
          status: "completed",
        },
      },
      { $group: { _id: null, ecoPoints: { $sum: "$ecoPointsAwarded" } } },
    ]);

    return res.status(200).json({
      success: true,
      message: "Supervisor overview fetched successfully",
      data: {
        ecoPointsAwarded: memberPickups[0]?.ecoPoints || 0,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const memberOverview = async (req, res, next) => {
  try {
    const userPickups = await Pickup.find({
      user: req.user._id,
      status: "completed",
    });

    const completedPickups = userPickups.length;
    const totalPickups = await Pickup.countDocuments({ user: req.user._id });
    
    let totalWeight = 0;
    userPickups.forEach(p => {
      totalWeight += (p.actualWeight || p.weight || 0);
    });

    const redeemedRewards = await RewardRedemption.countDocuments({
      user: req.user._id,
    });

    const user = await User.findById(req.user._id).select(
      "ecoPoints membershipPlan membershipStatus membershipEndDate",
    );

    return res.status(200).json({
      success: true,
      message: "Member overview fetched successfully",
      data: {
        totalPickups,
        completedPickups,
        ecoPoints: user.ecoPoints,
        redeemedRewards,
        currentMembership: user.membershipPlan || user.membershipStatus,
        membershipEndDate: user.membershipEndDate || null,
        totalRecycledKg: totalWeight,
        carbonSavedKg: Math.round(totalWeight * 2.5),
        waterConservedLitres: Math.round(totalWeight * 15),
        treesSaved: Math.max(0, Math.floor((totalWeight * 2.5) / 20)),
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  adminOverview,
  wasteByType,
  monthlyTrends,
  supervisorOverview,
  memberOverview,
};
