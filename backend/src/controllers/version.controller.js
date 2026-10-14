const { getVersionConfig } = require('../config/version.config');

/**
 * @desc    Get latest mobile app version and update metadata
 * @route   GET /api/app-version
 * @access  Public
 */
const getAppVersion = async (req, res, next) => {
  try {
    const config = getVersionConfig();

    return res.status(200).json({
      success: true,
      latestVersion: config.latestVersion,
      minimumVersion: config.minimumVersion,
      apkUrl: config.apkUrl,
      updateMessage: config.updateMessage,
      forceUpdate: config.forceUpdate,
      releaseDate: config.releaseDate,
      fileSizeBytes: config.fileSizeBytes,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAppVersion,
};
