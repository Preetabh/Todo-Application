const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate registration request body
 */
const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Full name is required and must be at least 2 characters long',
    });
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
    });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long',
    });
  }

  next();
};

/**
 * Validate login request body
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
    });
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Password is required',
    });
  }

  next();
};

/**
 * Validate user profile update request body
 */
const validateUpdateProfile = (req, res, next) => {
  const { name, email } = req.body;

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    return res.status(400).json({
      success: false,
      message: 'Name must be at least 2 characters long',
    });
  }

  if (email !== undefined && (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()))) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
    });
  }

  if (name === undefined && email === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name or email to update',
    });
  }

  next();
};

/**
 * Validate todo creation request body
 */
const validateCreateTodo = (req, res, next) => {
  const { title } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Todo title is required',
    });
  }

  if (title.trim().length > 200) {
    return res.status(400).json({
      success: false,
      message: 'Todo title cannot exceed 200 characters',
    });
  }

  next();
};

/**
 * Validate todo update request body
 */
const validateUpdateTodo = (req, res, next) => {
  const { title, description, completed } = req.body;

  if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
    return res.status(400).json({
      success: false,
      message: 'Todo title cannot be empty',
    });
  }

  if (title !== undefined && title.trim().length > 200) {
    return res.status(400).json({
      success: false,
      message: 'Todo title cannot exceed 200 characters',
    });
  }

  if (completed !== undefined && typeof completed !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'Completed status must be a boolean',
    });
  }

  if (title === undefined && description === undefined && completed === undefined) {
    return res.status(400).json({
      success: false,
      message: 'No fields provided for update',
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateCreateTodo,
  validateUpdateTodo,
};
