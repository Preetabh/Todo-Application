const mongoose = require('mongoose');
const Password = require('../models/Password');
const {
  encryptPassword,
  decryptPassword,
  evaluatePasswordStrength,
} = require('../utils/crypto.util');

/**
 * Format a password document for API response by decrypting its password
 */
const formatPasswordDoc = (doc) => {
  const json = doc.toJSON();
  const plainPassword = decryptPassword(
    doc.encryptedPassword,
    doc.iv,
    doc.authTag
  );
  return {
    ...json,
    password: plainPassword,
    strength: evaluatePasswordStrength(plainPassword),
  };
};

/**
 * @desc    Get all passwords for the authenticated user with search and filtering
 * @route   GET /api/passwords
 * @access  Private
 */
const getPasswords = async (req, res, next) => {
  try {
    const filter = { user: req.user._id };

    // Filter by category
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category.toLowerCase();
    }

    // Filter by favorite
    if (req.query.favorite !== undefined) {
      filter.isFavorite = req.query.favorite === 'true';
    }

    // Search by title or username or website
    if (req.query.search && req.query.search.trim()) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { username: searchRegex },
        { website: searchRegex },
      ];
    }

    const passwords = await Password.find(filter).sort({
      isFavorite: -1,
      createdAt: -1,
    });

    // Compute stats for overview
    const total = await Password.countDocuments({ user: req.user._id });
    const favoriteCount = await Password.countDocuments({
      user: req.user._id,
      isFavorite: true,
    });

    const decryptedList = passwords.map(formatPasswordDoc);

    res.status(200).json({
      success: true,
      count: decryptedList.length,
      stats: {
        total,
        favorites: favoriteCount,
      },
      data: decryptedList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single password by ID
 * @route   GET /api/passwords/:id
 * @access  Private
 */
const getPasswordById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password ID format',
      });
    }

    const passwordDoc = await Password.findById(id);

    if (!passwordDoc) {
      return res.status(404).json({
        success: false,
        message: 'Password entry not found',
      });
    }

    // Verify ownership
    if (passwordDoc.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this password',
      });
    }

    res.status(200).json({
      success: true,
      data: formatPasswordDoc(passwordDoc),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new encrypted password entry
 * @route   POST /api/passwords
 * @access  Private
 */
const createPassword = async (req, res, next) => {
  try {
    const {
      title,
      username,
      password: rawPassword,
      website,
      category,
      notes,
      isFavorite,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Account or service title is required',
      });
    }

    if (!rawPassword || typeof rawPassword !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    // Encrypt password using AES-256-GCM
    const { encrypted, iv, authTag } = encryptPassword(rawPassword);

    const newPassword = await Password.create({
      user: req.user._id,
      title: title.trim(),
      username: username ? username.trim() : '',
      encryptedPassword: encrypted,
      iv,
      authTag,
      website: website ? website.trim() : '',
      category: category ? category.toLowerCase() : 'login',
      notes: notes ? notes.trim() : '',
      isFavorite: Boolean(isFavorite),
    });

    res.status(201).json({
      success: true,
      message: 'Password saved securely',
      data: formatPasswordDoc(newPassword),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing password entry
 * @route   PATCH /api/passwords/:id
 * @access  Private
 */
const updatePassword = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password ID format',
      });
    }

    const passwordDoc = await Password.findById(id);

    if (!passwordDoc) {
      return res.status(404).json({
        success: false,
        message: 'Password entry not found',
      });
    }

    // Verify ownership
    if (passwordDoc.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this password',
      });
    }

    const {
      title,
      username,
      password: rawPassword,
      website,
      category,
      notes,
      isFavorite,
    } = req.body;

    if (title !== undefined) passwordDoc.title = title.trim();
    if (username !== undefined) passwordDoc.username = username.trim();
    if (website !== undefined) passwordDoc.website = website.trim();
    if (category !== undefined) passwordDoc.category = category.toLowerCase();
    if (notes !== undefined) passwordDoc.notes = notes.trim();
    if (isFavorite !== undefined) passwordDoc.isFavorite = Boolean(isFavorite);

    // If new password is provided, re-encrypt with fresh IV
    if (rawPassword !== undefined && rawPassword !== '') {
      const { encrypted, iv, authTag } = encryptPassword(rawPassword);
      passwordDoc.encryptedPassword = encrypted;
      passwordDoc.iv = iv;
      passwordDoc.authTag = authTag;
    }

    const updated = await passwordDoc.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: formatPasswordDoc(updated),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a password entry
 * @route   DELETE /api/passwords/:id
 * @access  Private
 */
const deletePassword = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password ID format',
      });
    }

    const passwordDoc = await Password.findById(id);

    if (!passwordDoc) {
      return res.status(404).json({
        success: false,
        message: 'Password entry not found',
      });
    }

    // Verify ownership
    if (passwordDoc.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this password',
      });
    }

    await Password.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Password removed from vault successfully',
      id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPasswords,
  getPasswordById,
  createPassword,
  updatePassword,
  deletePassword,
};
