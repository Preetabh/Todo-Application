const express = require('express');
const router = express.Router();
const {
  registerDeviceToken,
  unregisterDeviceToken,
  getDeviceTokenStatus,
} = require('../controllers/push.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', protect, registerDeviceToken);
router.delete('/unregister', protect, unregisterDeviceToken);
router.get('/status', protect, getDeviceTokenStatus);

module.exports = router;
