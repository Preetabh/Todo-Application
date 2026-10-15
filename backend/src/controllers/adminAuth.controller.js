const User = require('../models/User');
const AdminAuditLog = require('../models/AdminAuditLog');
const { generateToken } = require('../utils/jwt');

/**
 * @desc    Admin login
 * @route   POST /api/admin/auth/login
 * @access  Public (Rate limited)
 */
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both admin email and password',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user with password and role
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials',
      });
    }

    // Explicitly verify administrator role
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: This account does not possess administrator privileges',
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials',
      });
    }

    // Audit log successful login
    await AdminAuditLog.create({
      adminId: user._id,
      adminEmail: user.email,
      action: 'ADMIN_LOGIN',
      details: {
        mustChangePassword: user.mustChangePassword,
      },
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    const token = generateToken(user._id.toString());

    res.status(200).json({
      success: true,
      message: 'Admin authenticated successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change admin password (required when mustChangePassword is true)
 * @route   POST /api/admin/auth/change-password
 * @access  Private (Admin only)
 */
const changeAdminPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found',
      });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    await AdminAuditLog.create({
      adminId: user._id,
      adminEmail: user.email,
      action: 'PASSWORD_CHANGED',
      details: {
        reason: 'admin_credential_update',
      },
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully. Account is now fully secured.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current admin profile
 * @route   GET /api/admin/auth/me
 * @access  Private (Admin only)
 */
const getAdminMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        mustChangePassword: req.user.mustChangePassword,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin logout
 * @route   POST /api/admin/auth/logout
 * @access  Private (Admin only)
 */
const adminLogout = async (req, res, next) => {
  try {
    await AdminAuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: 'ADMIN_LOGOUT',
      details: {},
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.status(200).json({
      success: true,
      message: 'Admin logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adminLogin,
  changeAdminPassword,
  getAdminMe,
  adminLogout,
};
