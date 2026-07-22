const express = require('express');
const router = express.Router();
const tasksController = require('./tasks.controller');
const authMiddleware = require('../../middleware/auth.middleware');

// Apply auth middleware to all tasks routes
router.use(authMiddleware);

router.get('/', tasksController.getTasks);
router.get('/:id', tasksController.getTaskById);
router.post('/', tasksController.createTask);
router.put('/:id', tasksController.updateTask);
router.delete('/:id', tasksController.deleteTask);

module.exports = router;
