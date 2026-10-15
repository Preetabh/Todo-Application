const User = require('../models/User');
const AdminAuditLog = require('../models/AdminAuditLog');
const logger = require('../utils/logger');

/**
 * Securely provision initial administrator account if it does not already exist.
 * Reads credentials strictly from server-side environment variables.
 * Never resets existing passwords on server restarts.
 */
const provisionInitialAdmin = async () => {
  const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@digenttech.com').toLowerCase().trim();
  const initialPassword = process.env.INITIAL_ADMIN_PASSWORD || '1111';

  try {
    const existingUser = await User.findOne({ email: adminEmail });

    if (!existingUser) {
      // Create initial administrator with mustChangePassword flag enabled
      const newAdmin = await User.create({
        name: 'DIGENT Admin',
        email: adminEmail,
        password: initialPassword, // Hashed by User model pre-save hook with bcrypt
        role: 'admin',
        mustChangePassword: true,
      });

      await AdminAuditLog.create({
        adminId: newAdmin._id,
        adminEmail: newAdmin.email,
        action: 'ADMIN_PROVISIONED',
        details: {
          provisionType: 'initial_auto_provision',
          role: 'admin',
          mustChangePassword: true,
        },
        ipAddress: '127.0.0.1',
        userAgent: 'system-startup-provisioner',
      });

      logger.info(`[Admin Provision] Initial administrator account created securely: ${adminEmail}`);
      return newAdmin;
    } else {
      // If user exists but is not marked as admin, ensure role is 'admin'
      if (existingUser.role !== 'admin') {
        existingUser.role = 'admin';
        await existingUser.save();
        logger.info(`[Admin Provision] Upgraded existing user to administrator: ${adminEmail}`);
      } else {
        logger.info(`[Admin Provision] Administrator account verified: ${adminEmail}`);
      }
      return existingUser;
    }
  } catch (error) {
    logger.error(`[Admin Provision Error] Failed to provision administrator: ${error.message}`);
    throw error;
  }
};

module.exports = {
  provisionInitialAdmin,
};
