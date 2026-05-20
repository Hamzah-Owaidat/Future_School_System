const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get routes - accessible to all authenticated users (teachers, admins, etc.)
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

// Admin-only modifications
router.post('/', authorize('admin'), courseController.createCourse);
router.put('/:id', authorize('admin'), courseController.updateCourse);
router.delete('/:id', authorize('admin'), courseController.deleteCourse);

module.exports = router;
