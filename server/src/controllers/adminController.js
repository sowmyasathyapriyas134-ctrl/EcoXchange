const { User } = require("../models/User");
const { Supervisor } = require("../models/Supervisor");
const { DeliveryAgent } = require("../models/DeliveryAgent");
const { Recycler } = require("../models/Recycler");
const { Admin } = require("../models/Admin");
const { canManageRole } = require("../utils/canManageRole");
const { findUserByEmail } = require("../utils/findUserByEmail");
const { MembershipPurchase } = require("../models/MembershipPurchase");
const { UserToolkit } = require("../models/UserToolkit");
const { UserQRCode } = require("../models/UserQRCode");
const { generateUserQR } = require("../services/qrService");

const normalizeUser = (doc, modelName) => {
  if (!doc) return null;
  const u = doc.toObject ? doc.toObject() : { ...doc };
  delete u.password;
  
  // Normalize names
  const nameVal = u.fullName || u.name || u.companyName || "";
  u.name = nameVal;
  u.fullName = nameVal;
  u.companyName = nameVal;

  // Normalize phone numbers
  const phoneVal = u.phoneNumber || u.phone || "";
  u.phone = phoneVal;
  u.phoneNumber = phoneVal;

  // Normalize role for frontend
  if (modelName === "User") {
    if (u.membershipStatus === "member") {
      u.role = "member";
    } else {
      u.role = "trial_member";
    }
  } else if (modelName === "Supervisor") {
    u.role = "supervisor";
  } else if (modelName === "DeliveryAgent") {
    u.role = "delivery_agent";
  } else if (modelName === "Recycler") {
    u.role = "recycler";
  } else if (modelName === "Admin") {
    u.role = "admin";
  }

  return u;
};

// --------------------
// Existing admin APIs (legacy; still single-collection based)
// --------------------

const getAllUsers = async (req, res, next) => {
  try {
    const [users, supervisors, deliveryAgents, recyclers, admins] = await Promise.all([
      User.find().select("-password"),
      Supervisor.find().select("-password"),
      DeliveryAgent.find().select("-password"),
      Recycler.find().select("-password"),
      Admin.find().select("-password"),
    ]);

    const normalizedList = [
      ...users.map(u => normalizeUser(u, "User")),
      ...supervisors.map(u => normalizeUser(u, "Supervisor")),
      ...deliveryAgents.map(u => normalizeUser(u, "DeliveryAgent")),
      ...recyclers.map(u => normalizeUser(u, "Recycler")),
      ...admins.map(u => normalizeUser(u, "Admin")),
    ];

    normalizedList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: normalizedList,
    });
  } catch (err) {
    return next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const normalized = normalizeUser(req.targetUser, req.targetUserModelName || "User");
    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: normalized,
    });
  } catch (err) {
    return next(err);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    const targetUser = req.targetUser;
    const managerRole = req.user.role;

    // permission gate (belt & suspenders; middleware already checked)
    if (managerRole !== "admin") {
      const allowed = canManageRole(managerRole, role);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to manage this user",
        });
      }

      // explicit rule: supervisor cannot promote to privileged roles
      if (role === "supervisor" || role === "admin" || role === "recycler") {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to promote to this role",
        });
      }
    }

    targetUser.role = role;
    await targetUser.save();

    const updated = await User.findById(targetUser._id).select("-password");

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
};

const suspendUser = async (req, res, next) => {
  try {
    const { suspendedReason } = req.body;

    const targetUser = req.targetUser;

    targetUser.isSuspended = true;
    targetUser.suspendedAt = new Date();
    targetUser.suspendedReason = suspendedReason || "";

    await targetUser.save();

    const updated = await User.findById(targetUser._id).select("-password");

    return res.status(200).json({
      success: true,
      message: "User suspended successfully",
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
};

const restoreUser = async (req, res, next) => {
  try {
    const targetUser = req.targetUser;

    targetUser.isSuspended = false;
    targetUser.suspendedAt = undefined;
    targetUser.suspendedReason = undefined;

    await targetUser.save();

    const updated = await User.findById(targetUser._id).select("-password");

    return res.status(200).json({
      success: true,
      message: "User restored successfully",
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() === id) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete yourself",
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    return next(err);
  }
};

// --------------------
// New admin-only create APIs (multi-collection aware)
// --------------------
const { Wallet } = require("../models/Wallet");
const { findAccountByPhone } = require("../utils/findAccountByPhone");

const createTrialMember = async (req, res, next) => {
  try {
    const { email, fullName, phoneNumber, password, address, location } = req.body;
    if (!email || !fullName || !phoneNumber || !password) {
      return res.status(400).json({ success: false, message: "Email, Full Name, Phone Number, and Password are required" });
    }
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const existingPhone = await findAccountByPhone(phoneNumber);
    if (existingPhone) {
      return res.status(400).json({ success: false, message: "Phone number already registered" });
    }

    const userData = {
      fullName,
      email,
      phoneNumber,
      password,
      address: address || "",
      location: location || {},
      role: "citizen",
      membershipStatus: "trial",
      membershipStartDate: new Date(),
    };

    const user = await User.create(userData);

    // Initialize wallet
    await Wallet.create({ ownerId: user._id, ownerModel: "User" });

    return res.status(201).json({
      success: true,
      message: "Trial Member created successfully",
      data: normalizeUser(user, "User"),
    });
  } catch (err) {
    return next(err);
  }
};

const createPermanentMember = async (req, res, next) => {
  try {
    const { email, fullName, phoneNumber, password, address, membershipPlan, binSize } = req.body;
    if (!email || !fullName || !phoneNumber || !password) {
      return res.status(400).json({ success: false, message: "Email, Full Name, Phone Number, and Password are required" });
    }
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const existingPhone = await findAccountByPhone(phoneNumber);
    if (existingPhone) {
      return res.status(400).json({ success: false, message: "Phone number already registered" });
    }

    const selectedBinSize = binSize || "small";

    const userData = {
      fullName,
      email,
      phoneNumber,
      password,
      address: address || "",
      role: "citizen",
      membershipStatus: "member",
      membershipPlan: membershipPlan || "monthly",
      membershipStartDate: new Date(),
      binSize: selectedBinSize,
      membershipActivatedAt: new Date(),
      membershipEligibility: {
        isEligible: true,
        eligibleAt: new Date(),
      },
    };

    const user = await User.create(userData);

    // Initialize wallet
    if (req.body.initializeWallet !== false) {
      await Wallet.create({ ownerId: user._id, ownerModel: "User" });
    }

    // Initialize UserToolkit
    await UserToolkit.create({
      userId: user._id,
      dustbins: {
        count: 3,
        size: selectedBinSize,
        delivered: false,
      },
      covers: { quantity: 100 },
      qrStickers: { quantity: 100 },
      deliveryStatus: "processing",
    });

    // Generate unique QR
    await generateUserQR(user._id);

    // Create MembershipPurchase
    await MembershipPurchase.create({
      user: user._id,
      plan: membershipPlan || "monthly",
      amount: 300,
      binSize: selectedBinSize,
      razorpayOrderId: `admin_create_${Date.now()}`,
      razorpayPaymentId: `admin_approved_${Date.now()}`,
      paymentStatus: "success",
    });

    return res.status(201).json({
      success: true,
      message: "Permanent Member created successfully",
      data: normalizeUser(user, "User"),
    });
  } catch (err) {
    return next(err);
  }
};

const createSupervisor = async (req, res, next) => {
  try {
    const { email, fullName, name, phoneNumber, phone, password, address, employeeId, assignedZone, assignedZones } = req.body;
    const supervisorName = name || fullName;
    const supervisorPhone = phone || phoneNumber;

    if (!email || !supervisorName || !supervisorPhone || !password) {
      return res.status(400).json({
        success: false,
        message: "Email, Name, Phone, and Password are required",
      });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const existingPhone = await findAccountByPhone(supervisorPhone);
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered",
      });
    }

    const zones = assignedZones || (assignedZone ? [assignedZone] : []);

    const supervisor = await Supervisor.create({
      name: supervisorName,
      email,
      phone: supervisorPhone,
      password,
      address: address || "",
      employeeId: employeeId || "",
      assignedZones: zones,
    });

    await Wallet.create({ ownerId: supervisor._id, ownerModel: "Supervisor" });

    return res.status(201).json({
      success: true,
      message: "Supervisor created successfully",
      data: normalizeUser(supervisor, "Supervisor"),
    });
  } catch (err) {
    return next(err);
  }
};

const createDeliveryAgent = async (req, res, next) => {
  try {
    const { email, fullName, name, phoneNumber, phone, password, address, employeeId, vehicleType, vehicleNumber } = req.body;
    const agentName = name || fullName;
    const agentPhone = phone || phoneNumber;

    if (!email || !agentName || !agentPhone || !password) {
      return res.status(400).json({
        success: false,
        message: "Email, Name, Phone, and Password are required",
      });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const existingPhone = await findAccountByPhone(agentPhone);
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered",
      });
    }

    const deliveryAgent = await DeliveryAgent.create({
      name: agentName,
      email,
      phone: agentPhone,
      password,
      address: address || "",
      employeeId: employeeId || "",
      vehicleType: vehicleType || "",
      vehicleNumber: vehicleNumber || "",
    });

    await Wallet.create({ ownerId: deliveryAgent._id, ownerModel: "DeliveryAgent" });

    return res.status(201).json({
      success: true,
      message: "Delivery agent created successfully",
      data: normalizeUser(deliveryAgent, "DeliveryAgent"),
    });
  } catch (err) {
    return next(err);
  }
};

const createRecycler = async (req, res, next) => {
  try {
    const { email, companyName, fullName, contactPerson, phoneNumber, phone, password, address, licenseNumber } = req.body;
    const recyclerPhone = phone || phoneNumber;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required",
      });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    if (recyclerPhone) {
      const existingPhone = await findAccountByPhone(recyclerPhone);
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: "Phone number already registered",
        });
      }
    }

    const recycler = await Recycler.create({
      companyName: companyName || fullName || "Recycler Company",
      contactPerson: contactPerson || fullName || "",
      email,
      phone: recyclerPhone || "",
      password,
      address: address || "",
      licenseNumber: licenseNumber || "",
    });

    await Wallet.create({ ownerId: recycler._id, ownerModel: "Recycler" });

    return res.status(201).json({
      success: true,
      message: "Recycler created successfully",
      data: normalizeUser(recycler, "Recycler"),
    });
  } catch (err) {
    return next(err);
  }
};

const createAdmin = async (req, res, next) => {
  try {
    const { email, fullName, name, phoneNumber, phone, password, address } = req.body;
    const adminPhone = phone || phoneNumber;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required",
      });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    if (adminPhone) {
      const existingPhone = await findAccountByPhone(adminPhone);
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: "Phone number already registered",
        });
      }
    }

    const admin = await Admin.create({
      name: name || fullName || "Admin User",
      email,
      phone: adminPhone || "",
      password,
      address: address || "",
    });

    await Wallet.create({ ownerId: admin._id, ownerModel: "Admin" });

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: admin,
    });
  } catch (err) {
    return next(err);
  }
};

const createUserUnified = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    switch (role) {
      case "trial_member":
        return createTrialMember(req, res, next);
      case "member":
        return createPermanentMember(req, res, next);
      case "supervisor":
        return createSupervisor(req, res, next);
      case "delivery_agent":
        return createDeliveryAgent(req, res, next);
      case "recycler":
        return createRecycler(req, res, next);
      case "admin":
        return createAdmin(req, res, next);
      default:
        return res.status(400).json({
          success: false,
          message: `Invalid role: ${role}`,
        });
    }
  } catch (err) {
    return next(err);
  }
};

const updateUserUnified = async (req, res, next) => {
  try {
    const targetUser = req.targetUser;
    const updates = req.body;

    // Common fields
    if (updates.fullName !== undefined) targetUser.fullName = updates.fullName;
    if (updates.name !== undefined) targetUser.name = updates.name;
    if (updates.companyName !== undefined) targetUser.companyName = updates.companyName;
    if (updates.email !== undefined) targetUser.email = updates.email;
    if (updates.phone !== undefined) targetUser.phone = updates.phone;
    if (updates.phoneNumber !== undefined) targetUser.phoneNumber = updates.phoneNumber;
    if (updates.address !== undefined) targetUser.address = updates.address;
    if (updates.location !== undefined) targetUser.location = updates.location;

    // Role-specific fields
    if (targetUser.role === "citizen") {
      if (updates.membershipStatus !== undefined) targetUser.membershipStatus = updates.membershipStatus;
      if (updates.membershipPlan !== undefined) targetUser.membershipPlan = updates.membershipPlan;
    } else if (targetUser.role === "supervisor") {
      if (updates.employeeId !== undefined) targetUser.employeeId = updates.employeeId;
      if (updates.assignedZones !== undefined) targetUser.assignedZones = updates.assignedZones;
    } else if (targetUser.role === "delivery_agent") {
      if (updates.employeeId !== undefined) targetUser.employeeId = updates.employeeId;
      if (updates.vehicleType !== undefined) targetUser.vehicleType = updates.vehicleType;
      if (updates.vehicleNumber !== undefined) targetUser.vehicleNumber = updates.vehicleNumber;
    } else if (targetUser.role === "recycler") {
      if (updates.licenseNumber !== undefined) targetUser.licenseNumber = updates.licenseNumber;
    }

    await targetUser.save();

    const updatedClean = await targetUser.constructor.findById(targetUser._id).select("-password");

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedClean,
    });
  } catch (err) {
    return next(err);
  }
};

const updateUserStatusUnified = async (req, res, next) => {
  try {
    const targetUser = req.targetUser;
    const { isSuspended, reason } = req.body;

    if (isSuspended !== undefined) {
      targetUser.isSuspended = Boolean(isSuspended);
      if (targetUser.isSuspended) {
        targetUser.suspendedAt = new Date();
        targetUser.suspendedReason = reason || "Suspended by admin";
      } else {
        targetUser.suspendedAt = undefined;
        targetUser.suspendedReason = undefined;
      }
    }

    await targetUser.save();

    const updatedClean = await targetUser.constructor.findById(targetUser._id).select("-password");

    return res.status(200).json({
      success: true,
      message: `User ${targetUser.isSuspended ? "suspended" : "restored"} successfully`,
      data: updatedClean,
    });
  } catch (err) {
    return next(err);
  }
};

const resetUserPasswordUnified = async (req, res, next) => {
  try {
    const targetUser = req.targetUser;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    targetUser.password = password;
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (err) {
    return next(err);
  }
};

const promoteTrialMember = async (req, res, next) => {
  try {
    const { binSize } = req.body;
    const user = req.targetUser;

    if (req.targetUserModelName !== "User") {
      return res.status(400).json({
        success: false,
        message: "Only citizen users can be promoted",
      });
    }

    if (!binSize || !["small", "medium", "large"].includes(binSize)) {
      return res.status(400).json({
        success: false,
        message: "Valid binSize (small, medium, large) is required for promotion",
      });
    }

    if (user.membershipStatus === "member") {
      return res.status(400).json({
        success: false,
        message: "User is already a permanent member",
      });
    }

    // Convert membershipStatus -> member
    user.membershipStatus = "member";
    user.membershipPlan = "permanent";
    user.membershipActivatedAt = new Date();
    if (!user.membershipEligibility) {
      user.membershipEligibility = {};
    }
    user.membershipEligibility.isEligible = true;
    user.membershipEligibility.eligibleAt = new Date();
    user.binSize = binSize;
    user.membershipPaymentId = `admin_approved_${Date.now()}`;
    await user.save();

    // Create MembershipPurchase
    await MembershipPurchase.create({
      user: user._id,
      plan: "permanent",
      amount: 300,
      binSize,
      razorpayOrderId: `admin_promo_${Date.now()}`,
      razorpayPaymentId: user.membershipPaymentId,
      paymentStatus: "success",
    });

    // Create UserToolkit
    let toolkit = await UserToolkit.findOne({ userId: user._id });
    if (!toolkit) {
      toolkit = await UserToolkit.create({
        userId: user._id,
        dustbins: {
          count: 3,
          size: binSize,
          delivered: false,
        },
        covers: { quantity: 100 },
        qrStickers: { quantity: 100 },
        deliveryStatus: "processing",
      });
    }

    // Generate unique QR
    const qrCode = await generateUserQR(user._id);

    return res.status(200).json({
      success: true,
      message: "Trial Member promoted to Permanent successfully",
      data: {
        user: normalizeUser(user, "User"),
        toolkit,
        qrCode,
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  // legacy
  getAllUsers,
  getUserById,
  updateUserRole,
  suspendUser,
  restoreUser,
  deleteUser,

  // new
  createTrialMember,
  createPermanentMember,
  createSupervisor,
  createDeliveryAgent,
  createRecycler,
  createAdmin,

  // unified
  createUserUnified,
  updateUserUnified,
  updateUserStatusUnified,
  resetUserPasswordUnified,
  promoteTrialMember,
};
