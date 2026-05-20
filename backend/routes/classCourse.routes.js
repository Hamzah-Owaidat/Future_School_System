const express = require('express');
const router = express.Router();
const classCourseController = require('../controllers/classCourseController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get assignments - accessible to admins, principals, teachers
router.get('/', classCourseController.getClassCourses);
router.get('/:id', classCourseController.getClassCourseById);

// Admin-only modifications
router.post('/', authorize('admin'), classCourseController.createClassCourse);
router.put('/:id', authorize('admin'), classCourseController.updateClassCourse);
router.delete('/:id', authorize('admin'), classCourseController.deleteClassCourse);

module.exports = router;


