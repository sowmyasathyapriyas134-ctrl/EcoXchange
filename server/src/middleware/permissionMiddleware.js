const { findUserByIdAllCollections } = require("../utils/findUserById");
const { canManageRole } = require("../utils/canManageRole");

const canManageUser = () => {
  return async (req, res, next) => {
    try {
      const targetUserId = req.params.id;

      if (!targetUserId) {
        return res.status(400).json({
          success: false,
          message: "Missing user id",
        });
      }

      const result = await findUserByIdAllCollections(targetUserId);

      if (!result || !result.doc) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const targetUser = result.doc;

      if (req.user?.role === "admin") {
        req.targetUser = targetUser;
        req.targetUserModelName = result.modelName;
        return next();
      }

      const managerRole = req.user?.role;
      const targetRole = targetUser.role;

      if (!managerRole) {
        return res.status(401).json({
          success: false,
          message: "Not authorized. Missing user role",
        });
      }

      const allowed = canManageRole(managerRole, targetRole);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to manage this user",
        });
      }

      req.targetUser = targetUser;
      req.targetUserModelName = result.modelName;
      return next();
    } catch (err) {
      return next(err);
    }
  };
};

module.exports = { canManageUser };
