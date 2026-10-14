const mongoose = require('mongoose');
const Todo = require('../models/Todo');

/**
 * @desc    Get all todos for the authenticated user
 * @route   GET /api/todos
 * @access  Private
 */
const getTodos = async (req, res, next) => {
  try {
    const filter = { user: req.user._id };

    // Support optional filtering by completion status
    if (req.query.completed !== undefined) {
      filter.completed = req.query.completed === 'true';
    }

    const todos = await Todo.find(filter).sort({ createdAt: -1 });

    const total = await Todo.countDocuments({ user: req.user._id });
    const completedCount = await Todo.countDocuments({ user: req.user._id, completed: true });
    const pendingCount = total - completedCount;

    res.status(200).json({
      success: true,
      count: todos.length,
      stats: {
        total,
        pending: pendingCount,
        completed: completedCount,
      },
      data: todos,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single todo by ID
 * @route   GET /api/todos/:id
 * @access  Private
 */
const getTodoById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid todo ID format',
      });
    }

    const todo = await Todo.findById(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found',
      });
    }

    // Verify ownership
    if (!todo.user.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access this todo',
      });
    }

    res.status(200).json({
      success: true,
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new todo
 * @route   POST /api/todos
 * @access  Private
 */
const createTodo = async (req, res, next) => {
  try {
    const { title, description, completed } = req.body;

    const todo = await Todo.create({
      user: req.user._id,
      title: title.trim(),
      description: description ? description.trim() : '',
      completed: Boolean(completed),
    });

    res.status(201).json({
      success: true,
      message: 'Todo created successfully',
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a todo
 * @route   PATCH /api/todos/:id
 * @access  Private
 */
const updateTodo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid todo ID format',
      });
    }

    const todo = await Todo.findById(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found',
      });
    }

    // Verify ownership
    if (!todo.user.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify this todo',
      });
    }

    if (title !== undefined) {
      todo.title = title.trim();
    }

    if (description !== undefined) {
      todo.description = description.trim();
    }

    if (completed !== undefined) {
      todo.completed = Boolean(completed);
    }

    const updatedTodo = await todo.save();

    res.status(200).json({
      success: true,
      message: 'Todo updated successfully',
      data: updatedTodo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a todo
 * @route   DELETE /api/todos/:id
 * @access  Private
 */
const deleteTodo = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid todo ID format',
      });
    }

    const todo = await Todo.findById(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found',
      });
    }

    // Verify ownership
    if (!todo.user.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to delete this todo',
      });
    }

    await Todo.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Todo deleted successfully',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
};
