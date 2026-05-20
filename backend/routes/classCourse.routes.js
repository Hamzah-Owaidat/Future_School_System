const express = require('express');
const router = express.Router();
const classCourseController = require('../controllers/classCourseController');
const { protectEmployee, requirePermission } = require('../middleware/auth');

router.use(protectEmployee);

router.get(
  '/',
  requirePermission('course.read', 'course.manage', 'class.read', 'class.manage'),
  classCourseController.getClassCourses
);
router.get(
  '/:id',
  requirePermission('course.read', 'course.manage', 'class.read', 'class.manage'),
  classCourseController.getClassCourseById
);
router.post('/', requirePermission('course.manage'), classCourseController.createClassCourse);
router.put('/:id', requirePermission('course.manage'), classCourseController.updateClassCourse);
router.delete('/:id', requirePermission('course.manage'), classCourseController.deleteClassCourse);

module.exports = router;
