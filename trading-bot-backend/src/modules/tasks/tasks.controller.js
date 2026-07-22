const taskService = require('./tasks.service');

/**
 * Get all tasks
 */
const getTasks = async (req, res, next) => {
  try {
    const result = await taskService.getAllTasks(req.query);
    res.setHeader('x-total-count', result.total);
    return res.status(200).json(result.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get task by ID
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    return res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new task
 */
const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.body);
    return res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

/**
 * Update task
 */
const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.body);
    return res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete task
 */
const deleteTask = async (req, res, next) => {
  try {
    await taskService.deleteTask(req.params.id);
    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};
