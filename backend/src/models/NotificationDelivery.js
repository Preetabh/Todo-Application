const mongoose = require('mongoose');

const notificationDeliverySchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NotificationCampaign',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deviceToken: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DevicePushToken',
      default: null,
    },
    expoPushToken: {
      type: String,
      required: true,
    },
    ticketId: {
      type: String,
      default: null,
      index: true,
    },
    ticketStatus: {
      type: String,
      enum: ['pending', 'ok', 'error'],
      default: 'pending',
    },
    receiptStatus: {
      type: String,
      enum: ['pending', 'ok', 'error'],
      default: 'pending',
      index: true,
    },
    errorCode: {
      type: String,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    receiptCheckedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast receipt checks and campaign reporting
notificationDeliverySchema.index({ campaignId: 1, receiptStatus: 1 });
notificationDeliverySchema.index({ campaignId: 1, ticketStatus: 1 });
notificationDeliverySchema.index({ receiptStatus: 1, ticketId: 1 });

const NotificationDelivery = mongoose.model('NotificationDelivery', notificationDeliverySchema);

module.exports = NotificationDelivery;
