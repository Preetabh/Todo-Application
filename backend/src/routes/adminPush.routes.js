const express = require('express');
const router = express.Router();
const {
  getPushStats,
  getEligibleUsers,
  getRegisteredDevices,
  toggleDeviceActive,
  sendTest,
  createAndSendCampaign,
  getCampaigns,
  getCampaignById,
  cancelCampaign,
  checkCampaignReceipts,
  getAuditLogs,
} = require('../controllers/adminPush.controller');
const { protect } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

// All administrative push endpoints require valid JWT authentication and explicit admin privileges
router.use(protect, requireAdmin);

router.get('/stats', getPushStats);
router.get('/users', getEligibleUsers);
router.get('/devices', getRegisteredDevices);
router.patch('/devices/:id/toggle', toggleDeviceActive);
router.post('/test', sendTest);
router.post('/send', createAndSendCampaign);
router.get('/campaigns', getCampaigns);
router.get('/campaigns/:id', getCampaignById);
router.post('/campaigns/:id/cancel', cancelCampaign);
router.post('/campaigns/:id/check-receipts', checkCampaignReceipts);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
