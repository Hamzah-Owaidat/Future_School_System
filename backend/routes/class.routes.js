const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get routes - accessible to all authenticated users
router.get('/', classController.getAllClasses);
router.get('/:id', classController.getClassById);

// Create, update, delete - admin only
router.post('/', authorize('admin'), classController.createClass);
router.put('/:id', authorize('admin'), classController.updateClass);
router.delete('/:id', authorize('admin'), classController.deleteClass);

module.exports = router;

