const express = require('express');
const router = express.Router();
const {
  getPasswords,
  getPasswordById,
  createPassword,
  updatePassword,
  deletePassword,
} = require('../controllers/password.controller');
const { protect } = require('../middleware/auth.middleware');

// All password routes require authentication
router.use(protect);

router.route('/').get(getPasswords).post(createPassword);

router
  .route('/:id')
  .get(getPasswordById)
  .patch(updatePassword)
  .delete(deletePassword);

module.exports = router;
