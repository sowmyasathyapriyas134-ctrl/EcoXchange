/**
 * Strict admin gate for hidden admin portal APIs.
 * Verifies JWT (via prior protect), role === admin, account active.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
      errors: null,
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Forbidden",
      errors: null,
    });
  }

  if (req.user.isSuspended) {
    return res.status(403).json({
      success: false,
      message: "Account is suspended",
      errors: null,
    });
  }

  return next();
};

module.exports = { requireAdmin };
