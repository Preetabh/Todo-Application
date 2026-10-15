const DevicePushToken = require('../models/DevicePushToken');
const { isExpoPushToken } = require('../services/pushNotification.service');

/**
 * @desc    Register or update device push token
 * @route   POST /api/push/register
 * @access  Private (Mobile User)
 */
const registerDeviceToken = async (req, res, next) => {
  try {
    const {
      expoPushToken,
      platform = 'android',
      deviceId = null,
      deviceName = null,
      appVersion = null,
      permissionStatus = 'granted',
    } = req.body;

    if (!expoPushToken || !isExpoPushToken(expoPushToken)) {
      return res.status(400).json({
        success: false,
        message: 'A valid Expo Push Token is required (e.g. ExponentPushToken[...] or ExpoPushToken[...])',
      });
    }

    const normalizedToken = expoPushToken.trim();

    // Upsert token record and associate with current authenticated user
    const deviceToken = await DevicePushToken.findOneAndUpdate(
      { expoPushToken: normalizedToken },
      {
        userId: req.user._id,
        platform: ['android', 'ios', 'web', 'other'].includes(platform) ? platform : 'android',
        deviceId,
        deviceName,
        appVersion,
        permissionStatus,
        isActive: permissionStatus === 'granted',
        lastRegisteredAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Push notification token registered successfully',
      data: {
        id: deviceToken._id,
        expoPushToken: deviceToken.expoPushToken,
        platform: deviceToken.platform,
        isActive: deviceToken.isActive,
        lastRegisteredAt: deviceToken.lastRegisteredAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deactivate device push token (e.g. on logout or permissions revoked)
 * @route   DELETE /api/push/unregister
 * @access  Private (Mobile User)
 */
const unregisterDeviceToken = async (req, res, next) => {
  try {
    const { expoPushToken } = req.body;

    const filter = { userId: req.user._id };
    if (expoPushToken && typeof expoPushToken === 'string') {
      filter.expoPushToken = expoPushToken.trim();
    }

    await DevicePushToken.updateMany(filter, {
      isActive: false,
      lastRegisteredAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Push notification token deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's registered device push tokens
 * @route   GET /api/push/status
 * @access  Private (Mobile User)
 */
const getDeviceTokenStatus = async (req, res, next) => {
  try {
    const tokens = await DevicePushToken.find({ userId: req.user._id })
      .select('expoPushToken platform deviceName isActive permissionStatus lastRegisteredAt')
      .lean();

    res.status(200).json({
      success: true,
      count: tokens.length,
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerDeviceToken,
  unregisterDeviceToken,
  getDeviceTokenStatus,
};
