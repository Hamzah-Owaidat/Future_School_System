const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get routes - accessible to all authenticated users
router.get('/', studentController.getAllStudents);
router.get('/:id', studentController.getStudentById);

// Create, update, delete - admin only
router.post('/', authorize('admin'), studentController.createStudent);
router.put('/:id', authorize('admin'), studentController.updateStudent);
router.delete('/:id', authorize('admin'), studentController.deleteStudent);

module.exports = router;

