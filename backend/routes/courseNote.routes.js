const express = require('express');
const router = express.Router();
const courseNoteController = require('../controllers/courseNoteController');
const { protect, protectEmployee, requirePermission } = require('../middleware/auth');
const { canManageCourseNotes } = require('../middleware/courseAccess');

router.use(protect);

router.get('/me', courseNoteController.getMyCourseNotes);
router.get('/', courseNoteController.getCourseNotes);
router.get('/student/:studentId', courseNoteController.getStudentCourseNotes);

router.post('/', protectEmployee, canManageCourseNotes, courseNoteController.upsertCourseNote);
router.put('/:id', protectEmployee, canManageCourseNotes, courseNoteController.updateCourseNoteById);
router.delete(
  '/:id',
  protectEmployee,
  requirePermission('course_note.manage'),
  courseNoteController.deleteCourseNote
);

module.exports = router;
