const DevicePushToken = require('../models/DevicePushToken');
const NotificationCampaign = require('../models/NotificationCampaign');
const NotificationDelivery = require('../models/NotificationDelivery');
const logger = require('../utils/logger');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';
const BATCH_SIZE = 100; // Maximum allowed by Expo Push Service per chunk
const MAX_RETRIES = 3;

/**
 * Validates whether a string is a well-formed Expo push token
 */
const isExpoPushToken = (token) => {
  return typeof token === 'string' && /^(?:ExponentPushToken|ExpoPushToken)\[.*\]$/.test(token.trim());
};

/**
 * Helper to execute an HTTP POST request with bounded retries and exponential backoff
 */
const postWithRetry = async (url, payload, headers = {}, retries = MAX_RETRIES) => {
  let attempt = 0;
  let delay = 1000;

  while (attempt < retries) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          ...headers,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 429) {
        // Rate limited - wait with exponential backoff
        attempt++;
        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay;
        logger.warn(`[Push Engine] 429 Rate limited by Expo. Retrying in ${waitTime}ms (attempt ${attempt}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        delay *= 2;
        continue;
      }

      if (!response.ok && response.status >= 500) {
        // Server error on Expo side - retry
        attempt++;
        logger.warn(`[Push Engine] Expo server returned ${response.status}. Retrying in ${delay}ms (attempt ${attempt}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }

      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      attempt++;
      if (attempt >= retries) {
        logger.error(`[Push Engine Error] Request to ${url} failed after ${retries} attempts: ${err.message}`);
        throw err;
      }
      logger.warn(`[Push Engine] Network error: ${err.message}. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  throw new Error(`Failed to complete request to ${url} after ${retries} retries`);
};

/**
 * Split an array into chunks of specified size
 */
const chunkArray = (items, size = BATCH_SIZE) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

/**
 * Send a single direct test push notification
 */
const sendTestNotification = async ({ pushToken, title, message, deepLink, imageUrl }) => {
  if (!isExpoPushToken(pushToken)) {
    throw new Error('Invalid Expo Push Token format. Expected ExponentPushToken[...] or ExpoPushToken[...]');
  }

  const expoHeaders = {};
  if (process.env.EXPO_ACCESS_TOKEN) {
    expoHeaders.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  }

  const payload = [
    {
      to: pushToken.trim(),
      title: title || 'DIGENT TECH Test Notification',
      body: message || 'This is a test notification from the DIGENT TECH Admin Dashboard.',
      sound: 'default',
      priority: 'high',
      channelId: 'default',
      data: {
        isTest: true,
        deepLink: deepLink || 'myfirstapp://home',
        ...(imageUrl ? { imageUrl } : {}),
      },
    },
  ];

  const result = await postWithRetry(EXPO_PUSH_URL, payload, expoHeaders);
  const ticket = result.data?.data?.[0];

  return {
    success: ticket?.status === 'ok',
    ticket,
    data: result.data,
  };
};

/**
 * Core campaign execution engine
 */
const executeCampaign = async (campaignId) => {
  // Mutex lock using atomic findOneAndUpdate
  const campaign = await NotificationCampaign.findOneAndUpdate(
    {
      _id: campaignId,
      status: { $in: ['draft', 'scheduled'] },
    },
    {
      status: 'processing',
      startedAt: new Date(),
    },
    { new: true }
  );

  if (!campaign) {
    logger.info(`[Push Engine] Campaign ${campaignId} is already processing or completed.`);
    return;
  }

  logger.info(`[Push Engine] Starting execution of campaign ${campaign._id} ("${campaign.title}")`);

  try {
    // 1. Build query to retrieve eligible active device tokens
    let tokenQuery = { isActive: true };

    if (campaign.recipientType === 'specific' || campaign.recipientType === 'selected') {
      tokenQuery.userId = { $in: campaign.selectedUserIds };
    }

    if (campaign.recipientFilters?.platform && campaign.recipientFilters.platform !== 'all') {
      tokenQuery.platform = campaign.recipientFilters.platform;
    }

    // Retrieve active tokens in batches/lean format to avoid memory bloat
    const deviceTokens = await DevicePushToken.find(tokenQuery)
      .select('_id userId expoPushToken platform')
      .lean();

    // 2. Deduplicate by expoPushToken & filter valid tokens
    const uniqueTokensMap = new Map();
    for (const dt of deviceTokens) {
      if (isExpoPushToken(dt.expoPushToken) && !uniqueTokensMap.has(dt.expoPushToken)) {
        uniqueTokensMap.set(dt.expoPushToken, dt);
      }
    }

    const eligibleDevices = Array.from(uniqueTokensMap.values());
    const totalRecipients = eligibleDevices.length;

    await NotificationCampaign.findByIdAndUpdate(campaign._id, {
      totalRecipients,
    });

    if (totalRecipients === 0) {
      logger.info(`[Push Engine] No eligible recipients found for campaign ${campaign._id}`);
      await NotificationCampaign.findByIdAndUpdate(campaign._id, {
        status: 'completed',
        completedAt: new Date(),
        errorDetails: ['No eligible active push tokens found for target criteria'],
      });
      return;
    }

    logger.info(`[Push Engine] Dispatching campaign ${campaign._id} to ${totalRecipients} unique device tokens`);

    // 3. Batch messages in chunks of 100
    const batches = chunkArray(eligibleDevices, BATCH_SIZE);
    const expoHeaders = {};
    if (process.env.EXPO_ACCESS_TOKEN) {
      expoHeaders.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
    }

    let submittedCount = 0;
    let acceptedCount = 0;
    let failedCount = 0;
    const campaignErrors = [];

    for (const batch of batches) {
      const messages = batch.map((device) => ({
        to: device.expoPushToken,
        title: campaign.title,
        body: campaign.message,
        sound: 'default',
        priority: 'high',
        channelId: 'default',
        data: {
          campaignId: campaign._id.toString(),
          deepLink: campaign.deepLink || '',
          ...(campaign.imageUrl ? { imageUrl: campaign.imageUrl } : {}),
        },
      }));

      // Create initial delivery records
      const deliveryRecords = await NotificationDelivery.insertMany(
        batch.map((device) => ({
          campaignId: campaign._id,
          userId: device.userId,
          deviceToken: device._id,
          expoPushToken: device.expoPushToken,
          ticketStatus: 'pending',
          receiptStatus: 'pending',
          submittedAt: new Date(),
        }))
      );

      submittedCount += batch.length;

      try {
        const response = await postWithRetry(EXPO_PUSH_URL, messages, expoHeaders);
        const tickets = response.data?.data || [];

        // Process individual tickets
        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          const deliveryRecord = deliveryRecords[i];
          const device = batch[i];

          if (ticket.status === 'ok') {
            acceptedCount++;
            await NotificationDelivery.findByIdAndUpdate(deliveryRecord._id, {
              ticketId: ticket.id,
              ticketStatus: 'ok',
            });
          } else if (ticket.status === 'error') {
            failedCount++;
            const errorCode = ticket.details?.error || 'UNKNOWN_ERROR';
            const errorMessage = ticket.message || 'Push ticket rejected by Expo';

            campaignErrors.push(`Token error (${device.expoPushToken.slice(0, 15)}...): ${errorCode} - ${errorMessage}`);

            await NotificationDelivery.findByIdAndUpdate(deliveryRecord._id, {
              ticketStatus: 'error',
              receiptStatus: 'error',
              errorCode,
              errorMessage,
            });

            // Permanently deactivate invalid/unregistered devices
            if (errorCode === 'DeviceNotRegistered') {
              logger.warn(`[Push Engine] Deactivating invalid push token: ${device.expoPushToken}`);
              await DevicePushToken.findByIdAndUpdate(device._id, {
                isActive: false,
                permissionStatus: 'denied',
              });
            }
          }
        }
      } catch (batchError) {
        // Entire batch failed
        failedCount += batch.length;
        campaignErrors.push(`Batch submission error: ${batchError.message}`);

        await NotificationDelivery.updateMany(
          { _id: { $in: deliveryRecords.map((d) => d._id) } },
          {
            ticketStatus: 'error',
            receiptStatus: 'error',
            errorCode: 'BATCH_SEND_ERROR',
            errorMessage: batchError.message,
          }
        );
      }

      // Incrementally update campaign progress
      await NotificationCampaign.findByIdAndUpdate(campaign._id, {
        submittedCount,
        acceptedCount,
        failedCount,
        errorDetails: campaignErrors.slice(0, 50),
      });
    }

    // If no tickets were accepted at all, mark completed immediately
    if (acceptedCount === 0) {
      await NotificationCampaign.findByIdAndUpdate(campaign._id, {
        status: 'completed',
        completedAt: new Date(),
      });
    }

    logger.info(
      `[Push Engine] Completed batch dispatch for campaign ${campaign._id}: ` +
        `Submitted=${submittedCount}, Accepted=${acceptedCount}, Failed=${failedCount}`
    );
  } catch (error) {
    logger.error(`[Push Engine Error] Execution failure for campaign ${campaign._id}: ${error.message}`);
    await NotificationCampaign.findByIdAndUpdate(campaign._id, {
      status: 'failed',
      completedAt: new Date(),
      errorDetails: [error.message],
    });
  }
};

/**
 * Process pending Expo delivery receipts
 * Expo generates receipts after dispatching to APNs/FCM
 */
const processPendingReceipts = async () => {
  try {
    // Find deliveries with ticketId and pending receipt from the last 24 hours
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pendingDeliveries = await NotificationDelivery.find({
      ticketId: { $ne: null },
      receiptStatus: 'pending',
      submittedAt: { $gte: cutoff },
    })
      .select('_id campaignId deviceToken expoPushToken ticketId')
      .limit(500)
      .lean();

    if (pendingDeliveries.length === 0) {
      return;
    }

    const expoHeaders = {};
    if (process.env.EXPO_ACCESS_TOKEN) {
      expoHeaders.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
    }

    const chunks = chunkArray(pendingDeliveries, BATCH_SIZE);

    for (const chunk of chunks) {
      const ticketIds = chunk.map((d) => d.ticketId);
      const response = await postWithRetry(EXPO_RECEIPTS_URL, { ids: ticketIds }, expoHeaders);
      const receipts = response.data?.data || {};

      for (const delivery of chunk) {
        const receipt = receipts[delivery.ticketId];
        if (!receipt) {
          // Receipt not yet ready on Expo server
          continue;
        }

        if (receipt.status === 'ok') {
          await NotificationDelivery.findByIdAndUpdate(delivery._id, {
            receiptStatus: 'ok',
            receiptCheckedAt: new Date(),
          });

          await NotificationCampaign.findByIdAndUpdate(delivery.campaignId, {
            $inc: { deliveredCount: 1 },
          });
        } else if (receipt.status === 'error') {
          const errorCode = receipt.details?.error || 'RECEIPT_ERROR';
          const errorMessage = receipt.message || 'Delivery failed at push service';

          await NotificationDelivery.findByIdAndUpdate(delivery._id, {
            receiptStatus: 'error',
            errorCode,
            errorMessage,
            receiptCheckedAt: new Date(),
          });

          await NotificationCampaign.findByIdAndUpdate(delivery.campaignId, {
            $inc: { failedCount: 1 },
            $push: {
              errorDetails: `Receipt error (${delivery.expoPushToken.slice(0, 15)}...): ${errorCode} - ${errorMessage}`,
            },
          });

          // Permanent failure cleanup
          if (errorCode === 'DeviceNotRegistered' && delivery.deviceToken) {
            await DevicePushToken.findByIdAndUpdate(delivery.deviceToken, {
              isActive: false,
              permissionStatus: 'denied',
            });
          }
        }
      }
    }

    // Check if any processing campaigns have now finished all receipts
    const processingCampaigns = await NotificationCampaign.find({ status: 'processing' });
    for (const camp of processingCampaigns) {
      const remainingPending = await NotificationDelivery.countDocuments({
        campaignId: camp._id,
        receiptStatus: 'pending',
      });

      if (remainingPending === 0) {
        await NotificationCampaign.findByIdAndUpdate(camp._id, {
          status: 'completed',
          completedAt: new Date(),
        });
        logger.info(`[Push Engine] Campaign ${camp._id} marked completed after receipt reconciliation.`);
      }
    }
  } catch (error) {
    logger.error(`[Push Engine Error] Receipt processing error: ${error.message}`);
  }
};

module.exports = {
  isExpoPushToken,
  sendTestNotification,
  executeCampaign,
  processPendingReceipts,
};
