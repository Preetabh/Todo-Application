const mongoose = require('mongoose');

const devicePushTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for push token association'],
      index: true,
    },
    expoPushToken: {
      type: String,
      required: [true, 'Expo push token is required'],
      unique: true,
      trim: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['android', 'ios', 'web', 'other'],
      default: 'android',
    },
    deviceId: {
      type: String,
      trim: true,
      default: null,
    },
    deviceName: {
      type: String,
      trim: true,
      default: null,
    },
    appVersion: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    permissionStatus: {
      type: String,
      enum: ['granted', 'denied', 'undetermined'],
      default: 'granted',
    },
    lastRegisteredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user's active tokens quickly
devicePushTokenSchema.index({ userId: 1, isActive: 1 });
devicePushTokenSchema.index({ platform: 1, isActive: 1 });

const DevicePushToken = mongoose.model('DevicePushToken', devicePushTokenSchema);

module.exports = DevicePushToken;
