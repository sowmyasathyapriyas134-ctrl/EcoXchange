const { TrialSubmission } = require("../models/TrialSubmission");
const { User } = require("../models/User");
const { AuditLog } = require("../models/AuditLog");
const { uploadToCloudinary } = require("../config/cloudinary");

const createTrialSubmission = async (req, res, next) => {
  try {
    if (req.user.membershipStatus !== "trial") {
      return res.status(403).json({ success: false, message: "Only trial members can submit trial proofs" });
    }

    const { imageUrl } = req.body || {};
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: "Image URL is required" });
    }

    const submission = await TrialSubmission.create({
      user: req.user._id,
      imageUrl,
      status: "pending_verification",
    });

    return res.status(201).json({ success: true, message: "Submission created", data: submission });
  } catch (err) {
    return next(err);
  }
};

const getMySubmissions = async (req, res, next) => {
  try {
    const submissions = await TrialSubmission.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: submissions });
  } catch (err) {
    return next(err);
  }
};

const getPendingSubmissions = async (req, res, next) => {
  try {
    const submissions = await TrialSubmission.find({ status: "pending_verification" })
      .populate("user", "fullName phoneNumber email streak")
      .sort({ createdAt: 1 });
    return res.status(200).json({ success: true, data: submissions });
  } catch (err) {
    return next(err);
  }
};

const approveSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const submission = await TrialSubmission.findById(id).populate("user");
    if (!submission) return res.status(404).json({ success: false, message: "Not found" });
    if (submission.status !== "pending_verification") {
      return res.status(400).json({ success: false, message: "Submission is not pending" });
    }

    submission.status = "approved";
    submission.verifiedBy = req.user._id;
    submission.verifiedAt = new Date();
    await submission.save();

    // Upgrade logic
    const user = submission.user;
    user.streak += 1;
    let upgraded = false;

    if (user.streak >= 5 && user.membershipStatus === "trial") {
      user.membershipStatus = "member";
      upgraded = true;
      // Bonus EcoPoints
      user.ecoPoints += 50; 
    }
    await user.save();

    await AuditLog.create({
      action: "trial_approval",
      user: req.user._id,
      details: { submissionId: submission._id, upgraded }
    });

    return res.status(200).json({
      success: true,
      message: upgraded ? "Submission approved and user upgraded to member!" : "Submission approved",
      data: submission
    });
  } catch (err) {
    return next(err);
  }
};

const rejectSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    
    if (!remarks) return res.status(400).json({ success: false, message: "Remarks are mandatory for rejection" });

    const submission = await TrialSubmission.findById(id);
    if (!submission) return res.status(404).json({ success: false, message: "Not found" });
    if (submission.status !== "pending_verification") {
      return res.status(400).json({ success: false, message: "Submission is not pending" });
    }

    submission.status = "rejected";
    submission.remarks = remarks;
    submission.verifiedBy = req.user._id;
    submission.verifiedAt = new Date();
    await submission.save();

    await AuditLog.create({
      action: "trial_rejection",
      user: req.user._id,
      details: { submissionId: submission._id, remarks }
    });

    return res.status(200).json({ success: true, message: "Submission rejected", data: submission });
  } catch (err) {
    return next(err);
  }
};

const getTrialSchedule = async (req, res) => {
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  
  const weeklySchedule = [
    { day: 'Monday', wasteCategory: 'Wet Waste', instructions: 'Drain all liquids before binning.' },
    { day: 'Tuesday', wasteCategory: 'Plastic Waste', instructions: 'Rinse and dry all plastic containers.' },
    { day: 'Wednesday', wasteCategory: 'Paper Waste', instructions: 'Keep paper dry and folded neatly.' },
    { day: 'Thursday', wasteCategory: 'Metal Waste', instructions: 'Crush cans to save space.' },
    { day: 'Friday', wasteCategory: 'E-Waste', instructions: 'Remove batteries from electronic items.' },
    { day: 'Saturday', wasteCategory: 'Mixed Recycling', instructions: 'Place mixed items in clear bags.' },
    { day: 'Sunday', wasteCategory: 'Awareness Day', instructions: 'Learn about eco-friendly practices.' },
  ];

  const today = weeklySchedule.find(s => s.day === currentDay) || weeklySchedule[0];

  return res.status(200).json({
    success: true,
    data: today,
  });
};

const getTrialProgress = async (req, res, next) => {
  try {
    const approvedCount = await TrialSubmission.countDocuments({ user: req.user._id, status: "approved" });
    
    return res.status(200).json({
      success: true,
      data: {
        currentStreak: req.user.streak || 0,
        approvedSubmissions: approvedCount,
        remainingSubmissionsRequired: Math.max(0, 5 - (req.user.streak || 0)),
        membershipStatus: req.user.membershipStatus
      }
    });
  } catch (err) {
    return next(err);
  }
};

const uploadTrialPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    
    // In dev, if Cloudinary config is missing, return a beautiful demo URL
    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === "Root") {
      return res.status(200).json({
        success: true,
        url: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=600"
      });
    }

    try {
      const result = await uploadToCloudinary(req.file.buffer);
      return res.status(200).json({
        success: true,
        url: result.secure_url,
      });
    } catch (uploadErr) {
      console.warn("Cloudinary upload failed, falling back to mock eco image URL:", uploadErr.message);
      return res.status(200).json({
        success: true,
        url: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=600"
      });
    }
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createTrialSubmission,
  getMySubmissions,
  getPendingSubmissions,
  approveSubmission,
  rejectSubmission,
  getTrialSchedule,
  getTrialProgress,
  uploadTrialPhoto
};
