const express = require('express');
const router = express.Router();
const { getAppVersion } = require('../controllers/version.controller');

// Public route to check current app version requirements
router.get('/', getAppVersion);

module.exports = router;
