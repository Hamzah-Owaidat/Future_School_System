const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { protectEmployee, requirePermission } = require('../middleware/auth');

router.use(protectEmployee);

router.get('/', requirePermission('course.read', 'course.manage'), courseController.getAllCourses);
router.get('/:id', requirePermission('course.read', 'course.manage'), courseController.getCourseById);
router.post('/', requirePermission('course.manage'), courseController.createCourse);
router.put('/:id', requirePermission('course.manage'), courseController.updateCourse);
router.delete('/:id', requirePermission('course.manage'), courseController.deleteCourse);

module.exports = router;
