const mongoose = require('mongoose');

const notificationCampaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Campaign title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Campaign message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    imageUrl: {
      type: String,
      trim: true,
      default: null,
    },
    recipientType: {
      type: String,
      enum: ['all', 'selected', 'specific', 'filtered'],
      default: 'all',
      required: true,
    },
    recipientFilters: {
      platform: {
        type: String,
        enum: ['all', 'android', 'ios', 'web'],
        default: 'all',
      },
    },
    selectedUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    deepLink: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scheduledAt: {
      type: Date,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    totalRecipients: {
      type: Number,
      default: 0,
    },
    submittedCount: {
      type: Number,
      default: 0,
    },
    acceptedCount: {
      type: Number,
      default: 0,
    },
    deliveredCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    errorDetails: {
      type: [String],
      default: [],
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationCampaignSchema.index({ createdAt: -1 });
notificationCampaignSchema.index({ status: 1, scheduledAt: 1 });

const NotificationCampaign = mongoose.model('NotificationCampaign', notificationCampaignSchema);

module.exports = NotificationCampaign;
