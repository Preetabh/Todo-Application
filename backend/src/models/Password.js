const mongoose = require('mongoose');

const passwordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Password entry must belong to a user'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Account/Service title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    username: {
      type: String,
      trim: true,
      default: '',
      maxlength: [150, 'Username cannot exceed 150 characters'],
    },
    encryptedPassword: {
      type: String,
      required: [true, 'Encrypted password is required'],
    },
    iv: {
      type: String,
      required: [true, 'Encryption IV is required'],
    },
    authTag: {
      type: String,
      required: [true, 'Encryption auth tag is required'],
    },
    website: {
      type: String,
      trim: true,
      default: '',
      maxlength: [300, 'Website URL cannot exceed 300 characters'],
    },
    category: {
      type: String,
      enum: ['login', 'card', 'finance', 'social', 'work', 'other'],
      default: 'login',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        // Don't expose internal crypto fields directly in JSON
        delete ret.encryptedPassword;
        delete ret.iv;
        delete ret.authTag;
        return ret;
      },
    },
  }
);

// Compound index for querying user's passwords quickly
passwordSchema.index({ user: 1, isFavorite: -1, createdAt: -1 });
passwordSchema.index({ user: 1, category: 1 });

const Password = mongoose.model('Password', passwordSchema);

module.exports = Password;
