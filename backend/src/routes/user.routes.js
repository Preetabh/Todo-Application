const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateUpdateProfile } = require('../middleware/validate.middleware');

router.use(protect);

router.get('/me', getProfile);
router.patch('/me', validateUpdateProfile, updateProfile);

module.exports = router;
