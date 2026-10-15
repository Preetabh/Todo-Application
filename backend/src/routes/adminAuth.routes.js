const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  adminLogin,
  changeAdminPassword,
  getAdminMe,
  adminLogout,
} = require('../controllers/adminAuth.controller');
const { protect } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

// Strict rate limiter for admin login to mitigate brute force attacks
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many administrative login attempts. Please try again after 15 minutes.',
  },
});

router.post('/login', adminLoginLimiter, adminLogin);
router.post('/change-password', protect, requireAdmin, changeAdminPassword);
router.get('/me', protect, requireAdmin, getAdminMe);
router.post('/logout', protect, requireAdmin, adminLogout);

module.exports = router;
