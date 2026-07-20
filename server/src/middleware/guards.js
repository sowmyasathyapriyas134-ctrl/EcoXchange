const jwt = require("jsonwebtoken");
const { findUserById } = require("../utils/findUserById");

/**
 * Protect middleware: validates JWT and attaches req.user
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Missing Bearer token",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Missing token",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const modelName = decoded?.model;
    
    if (!modelName) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Invalid token payload",
      });
    }

    const user = await findUserById(decoded.id, modelName);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. User not found",
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: "Account is suspended",
      });
    }

    req.user = user;
    req.modelName = modelName;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. Invalid or expired token",
    });
  }
};

/**
 * Authorize middleware: restricts access to specific roles
 * Usage: authorize("admin", "supervisor")
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. User role not defined",
      });
    }

    const userRoles = [req.user.role];
    if (req.user.role === "citizen") {
      if (req.user.membershipStatus === "trial") {
        userRoles.push("trial_member");
      } else if (req.user.membershipStatus === "member") {
        userRoles.push("member");
      }
    }

    const isAuthorized = roles.some((role) => userRoles.includes(role));

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role ${req.user.role} is not authorized to access this resource`,
      });
    }

    next();
  };
};

/**
 * MembershipGuard middleware: restricts access based on membershipStatus
 * Usage: membershipGuard("member", "staff")
 */
const membershipGuard = (...statuses) => {
  return (req, res, next) => {
    if (!req.user || !req.user.membershipStatus) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Membership status not defined",
      });
    }

    if (!statuses.includes(req.user.membershipStatus)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Trial users cannot access this resource`,
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
  membershipGuard,
};
