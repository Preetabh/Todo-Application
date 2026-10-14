const express = require('express');
const router = express.Router();
const {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
} = require('../controllers/todo.controller');
const { protect } = require('../middleware/auth.middleware');
const {
  validateCreateTodo,
  validateUpdateTodo,
} = require('../middleware/validate.middleware');

router.use(protect);

router.route('/')
  .get(getTodos)
  .post(validateCreateTodo, createTodo);

router.route('/:id')
  .get(getTodoById)
  .patch(validateUpdateTodo, updateTodo)
  .delete(deleteTodo);

module.exports = router;
