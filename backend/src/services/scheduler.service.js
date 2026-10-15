const NotificationCampaign = require('../models/NotificationCampaign');
const { executeCampaign, processPendingReceipts } = require('./pushNotification.service');
const logger = require('../utils/logger');

let schedulerInterval = null;
let isProcessingScheduled = false;

/**
 * Look for scheduled campaigns that are ready to run
 * Uses atomic findOneAndUpdate to prevent duplicate processing across instances
 */
const processScheduledCampaigns = async () => {
  if (isProcessingScheduled) return;
  isProcessingScheduled = true;

  try {
    const now = new Date();

    // Find any scheduled campaigns whose scheduled time has arrived
    const eligibleCampaigns = await NotificationCampaign.find({
      status: 'scheduled',
      scheduledAt: { $lte: now },
    })
      .select('_id')
      .lean();

    for (const c of eligibleCampaigns) {
      // Execute each campaign asynchronously through the delivery engine
      executeCampaign(c._id).catch((err) => {
        logger.error(`[Scheduler Error] Failed executing scheduled campaign ${c._id}: ${err.message}`);
      });
    }

    // Also run receipt checking for pending tickets
    processPendingReceipts().catch((err) => {
      logger.error(`[Scheduler Error] Failed processing receipts: ${err.message}`);
    });
  } catch (error) {
    logger.error(`[Scheduler Error] Error checking scheduled campaigns: ${error.message}`);
  } finally {
    isProcessingScheduled = false;
  }
};

/**
 * Start background scheduler worker
 * Runs every 30 seconds
 */
const startScheduler = (intervalMs = 30000) => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  logger.info(`[Scheduler] Persistent notification scheduler initialized (interval: ${intervalMs / 1000}s)`);

  // Run initial check right after start to recover any pending/missed jobs
  processScheduledCampaigns();

  schedulerInterval = setInterval(() => {
    processScheduledCampaigns();
  }, intervalMs);

  // Allow Node process to exit cleanly if needed
  if (schedulerInterval.unref) {
    schedulerInterval.unref();
  }
};

/**
 * Stop background scheduler
 */
const stopScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info('[Scheduler] Persistent notification scheduler stopped.');
  }
};

module.exports = {
  startScheduler,
  stopScheduler,
  processScheduledCampaigns,
};
