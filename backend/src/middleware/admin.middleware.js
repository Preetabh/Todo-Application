/**
 * Middleware to require explicit administrator privileges
 * Must be preceded by protect middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: Authentication required',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Administrator privileges required to access this resource',
    });
  }

  next();
};

module.exports = {
  requireAdmin,
};
