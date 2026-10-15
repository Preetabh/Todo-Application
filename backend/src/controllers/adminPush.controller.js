const mongoose = require('mongoose');
const User = require('../models/User');
const DevicePushToken = require('../models/DevicePushToken');
const NotificationCampaign = require('../models/NotificationCampaign');
const NotificationDelivery = require('../models/NotificationDelivery');
const AdminAuditLog = require('../models/AdminAuditLog');
const {
  isExpoPushToken,
  sendTestNotification,
  executeCampaign,
  processPendingReceipts,
} = require('../services/pushNotification.service');

/**
 * @desc    Get real-time dashboard push statistics
 * @route   GET /api/admin/push/stats
 * @access  Private (Admin only)
 */
const getPushStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};

    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // 1. Total registered users
    const totalUsers = await User.countDocuments();

    // 2. Active push users (distinct userIds with active tokens)
    const activePushUserIds = await DevicePushToken.distinct('userId', { isActive: true });
    const usersWithActiveTokens = activePushUserIds.length;

    // 3. Device tokens count
    const totalTokens = await DevicePushToken.countDocuments();
    const activeTokens = await DevicePushToken.countDocuments({ isActive: true });

    // 4. Platform breakdown for active tokens
    const platformStats = await DevicePushToken.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$platform', count: { $sum: 1 } } },
    ]);
    const platformBreakdown = { android: 0, ios: 0, web: 0, other: 0 };
    platformStats.forEach((p) => {
      platformBreakdown[p._id || 'other'] = p.count;
    });

    // 5. Campaign totals and delivery counts
    const campaignStats = await NotificationCampaign.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalCampaigns: { $sum: 1 },
          submittedCount: { $sum: '$submittedCount' },
          acceptedCount: { $sum: '$acceptedCount' },
          deliveredCount: { $sum: '$deliveredCount' },
          failedCount: { $sum: '$failedCount' },
        },
      },
    ]);

    const scheduledCampaigns = await NotificationCampaign.countDocuments({
      status: 'scheduled',
      ...dateFilter,
    });

    const aggregate = campaignStats[0] || {
      totalCampaigns: 0,
      submittedCount: 0,
      acceptedCount: 0,
      deliveredCount: 0,
      failedCount: 0,
    };

    // 6. Recent campaigns (last 5)
    const recentCampaigns = await NotificationCampaign.find(dateFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        usersWithActiveTokens,
        totalTokens,
        activeTokens,
        platformBreakdown,
        totalCampaigns: aggregate.totalCampaigns,
        notificationsSubmitted: aggregate.submittedCount,
        notificationsAccepted: aggregate.acceptedCount,
        successfulDeliveries: aggregate.deliveredCount,
        failedDeliveries: aggregate.failedCount,
        scheduledCampaigns,
      },
      recentCampaigns,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get eligible users with search and pagination
 * @route   GET /api/admin/push/users
 * @access  Private (Admin only)
 */
const getEligibleUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : '';
    const hasTokenFilter = req.query.hasToken;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (hasTokenFilter === 'true' || hasTokenFilter === 'false') {
      const usersWithActiveTokens = await DevicePushToken.distinct('userId', { isActive: true });
      if (hasTokenFilter === 'true') {
        query._id = { $in: usersWithActiveTokens };
      } else {
        query._id = { $nin: usersWithActiveTokens };
      }
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Attach active tokens info to each user
    const userIds = users.map((u) => u._id);
    const activeTokens = await DevicePushToken.find({
      userId: { $in: userIds },
      isActive: true,
    })
      .select('userId platform deviceName expoPushToken lastRegisteredAt')
      .lean();

    const tokenMap = new Map();
    for (const t of activeTokens) {
      const uId = t.userId.toString();
      if (!tokenMap.has(uId)) tokenMap.set(uId, []);
      tokenMap.get(uId).push(t);
    }

    const enrichedUsers = users.map((u) => {
      const tokens = tokenMap.get(u._id.toString()) || [];
      return {
        ...u,
        hasActiveToken: tokens.length > 0,
        tokenCount: tokens.length,
        devices: tokens,
      };
    });

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      users: enrichedUsers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get registered devices list with filters
 * @route   GET /api/admin/push/devices
 * @access  Private (Admin only)
 */
const getRegisteredDevices = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { platform, isActive, search } = req.query;

    const query = {};
    if (platform && platform !== 'all') {
      query.platform = platform;
    }
    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }
    if (search && search.trim()) {
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: search.trim(), $options: 'i' } },
          { email: { $regex: search.trim(), $options: 'i' } },
        ],
      }).select('_id');

      query.$or = [
        { expoPushToken: { $regex: search.trim(), $options: 'i' } },
        { deviceName: { $regex: search.trim(), $options: 'i' } },
        { userId: { $in: matchingUsers.map((u) => u._id) } },
      ];
    }

    const total = await DevicePushToken.countDocuments(query);
    const devices = await DevicePushToken.find(query)
      .populate('userId', 'name email')
      .sort({ lastRegisteredAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      devices,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle device active status
 * @route   PATCH /api/admin/push/devices/:id/toggle
 * @access  Private (Admin only)
 */
const toggleDeviceActive = async (req, res, next) => {
  try {
    const device = await DevicePushToken.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device token not found' });
    }

    device.isActive = !device.isActive;
    await device.save();

    await AdminAuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: 'DEVICE_STATUS_TOGGLED',
      details: {
        tokenId: device._id,
        newStatus: device.isActive,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: `Device token marked as ${device.isActive ? 'active' : 'inactive'}`,
      data: device,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send instant test push notification
 * @route   POST /api/admin/push/test
 * @access  Private (Admin only)
 */
const sendTest = async (req, res, next) => {
  try {
    let { pushToken, title, message, deepLink, imageUrl } = req.body;

    // If no token explicitly provided, attempt to locate admin's own registered token
    if (!pushToken) {
      const adminToken = await DevicePushToken.findOne({ userId: req.user._id, isActive: true });
      if (adminToken) {
        pushToken = adminToken.expoPushToken;
      }
    }

    if (!pushToken) {
      return res.status(400).json({
        success: false,
        message: 'No push token provided and no registered device found for current admin.',
      });
    }

    const result = await sendTestNotification({
      pushToken,
      title: title || 'DIGENT TECH Test Notification',
      message: message || 'Test push notification delivered from Admin Dashboard',
      deepLink: deepLink || 'myfirstapp://home',
      imageUrl,
    });

    await AdminAuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: 'TEST_PUSH_SENT',
      details: {
        pushToken: pushToken.slice(0, 15) + '...',
        status: result.success ? 'ok' : 'failed',
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: result.success
        ? 'Test notification submitted to Expo Push Service successfully'
        : 'Notification submission returned an error from Expo',
      result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create and send/schedule a notification campaign
 * @route   POST /api/admin/push/send
 * @access  Private (Admin only)
 */
const createAndSendCampaign = async (req, res, next) => {
  try {
    const {
      title,
      message,
      imageUrl = null,
      recipientType = 'all',
      recipientFilters = { platform: 'all' },
      selectedUserIds = [],
      deepLink = '',
      deliverySchedule = 'now',
      scheduledAt = null,
    } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Notification title is required' });
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Notification message is required' });
    }

    if (['selected', 'specific'].includes(recipientType) && (!selectedUserIds || selectedUserIds.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one recipient for targeted campaigns',
      });
    }

    let parsedScheduledDate = null;
    let initialStatus = 'draft';

    if (deliverySchedule === 'later') {
      if (!scheduledAt) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled date and time is required when scheduling for later',
        });
      }
      parsedScheduledDate = new Date(scheduledAt);
      if (isNaN(parsedScheduledDate.getTime()) || parsedScheduledDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled date must be a valid future timestamp',
        });
      }
      initialStatus = 'scheduled';
    }

    // Calculate eligible recipients
    let eligibleCount = 0;
    const tokenQuery = { isActive: true };
    if (['selected', 'specific'].includes(recipientType)) {
      tokenQuery.userId = { $in: selectedUserIds };
    }
    if (recipientFilters?.platform && recipientFilters.platform !== 'all') {
      tokenQuery.platform = recipientFilters.platform;
    }
    eligibleCount = await DevicePushToken.distinct('expoPushToken', tokenQuery).then((t) => t.length);

    // Create the campaign record
    const campaign = await NotificationCampaign.create({
      title: title.trim(),
      message: message.trim(),
      imageUrl: imageUrl && imageUrl.trim() ? imageUrl.trim() : null,
      recipientType,
      recipientFilters,
      selectedUserIds,
      deepLink: deepLink ? deepLink.trim() : '',
      createdBy: req.user._id,
      scheduledAt: parsedScheduledDate,
      status: initialStatus,
      totalRecipients: eligibleCount,
    });

    await AdminAuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: deliverySchedule === 'later' ? 'CAMPAIGN_SCHEDULED' : 'CAMPAIGN_SUBMITTED',
      details: {
        campaignId: campaign._id,
        title: campaign.title,
        recipientType,
        totalRecipients: eligibleCount,
        deliverySchedule,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // If immediate delivery, execute asynchronously
    if (deliverySchedule === 'now') {
      executeCampaign(campaign._id).catch((err) => {
        logger.error(`[Admin Push Error] Background execution failed for ${campaign._id}: ${err.message}`);
      });
    }

    res.status(201).json({
      success: true,
      message:
        deliverySchedule === 'later'
          ? `Campaign scheduled successfully for ${parsedScheduledDate.toISOString()}`
          : 'Campaign submitted for immediate push delivery',
      campaign: {
        id: campaign._id,
        title: campaign.title,
        status: campaign.status,
        recipientType: campaign.recipientType,
        totalRecipients: eligibleCount,
        scheduledAt: campaign.scheduledAt,
        createdAt: campaign.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get campaign history
 * @route   GET /api/admin/push/campaigns
 * @access  Private (Admin only)
 */
const getCampaigns = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;
    const { search, status, recipientType, startDate, endDate } = req.query;

    const query = {};
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { message: { $regex: search.trim(), $options: 'i' } },
      ];
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (recipientType && recipientType !== 'all') {
      query.recipientType = recipientType;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await NotificationCampaign.countDocuments(query);
    const campaigns = await NotificationCampaign.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      campaigns,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single campaign details and delivery records
 * @route   GET /api/admin/push/campaigns/:id
 * @access  Private (Admin only)
 */
const getCampaignById = async (req, res, next) => {
  try {
    const campaign = await NotificationCampaign.findById(req.params.id)
      .populate('createdBy', 'name email')
      .lean();

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Notification campaign not found' });
    }

    // Get delivery breakdown
    const deliveries = await NotificationDelivery.find({ campaignId: campaign._id })
      .populate('userId', 'name email')
      .sort({ submittedAt: -1 })
      .limit(200)
      .lean();

    const deliverySummary = await NotificationDelivery.aggregate([
      { $match: { campaignId: new mongoose.Types.ObjectId(req.params.id) } },
      {
        $group: {
          _id: { ticketStatus: '$ticketStatus', receiptStatus: '$receiptStatus' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      campaign,
      deliveries,
      deliverySummary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a scheduled campaign
 * @route   POST /api/admin/push/campaigns/:id/cancel
 * @access  Private (Admin only)
 */
const cancelCampaign = async (req, res, next) => {
  try {
    const campaign = await NotificationCampaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Notification campaign not found' });
    }

    if (!['scheduled', 'draft'].includes(campaign.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel campaign in "${campaign.status}" state. Only scheduled or draft campaigns can be cancelled.`,
      });
    }

    campaign.status = 'cancelled';
    await campaign.save();

    await AdminAuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: 'CAMPAIGN_CANCELLED',
      details: { campaignId: campaign._id, title: campaign.title },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: 'Scheduled campaign cancelled successfully',
      campaign,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    On-demand push receipt check for a campaign
 * @route   POST /api/admin/push/campaigns/:id/check-receipts
 * @access  Private (Admin only)
 */
const checkCampaignReceipts = async (req, res, next) => {
  try {
    await processPendingReceipts();

    const updatedCampaign = await NotificationCampaign.findById(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Receipt verification cycle executed',
      campaign: updatedCampaign,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get admin audit logs
 * @route   GET /api/admin/push/audit-logs
 * @access  Private (Admin only)
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { action } = req.query;

    const query = {};
    if (action && action !== 'all') {
      query.action = action;
    }

    const total = await AdminAuditLog.countDocuments(query);
    const logs = await AdminAuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
