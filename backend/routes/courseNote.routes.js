const express = require('express');
const router = express.Router();
const courseNoteController = require('../controllers/courseNoteController');
const { protect, authorize } = require('../middleware/auth');
const { canManageCourseNotes } = require('../middleware/courseAccess');

// All routes require authentication
router.use(protect);

// Get notes - accessible to admins, principals, and teachers
router.get('/', courseNoteController.getCourseNotes);
router.get('/student/:studentId', courseNoteController.getStudentCourseNotes);

// Create/update (upsert) notes - only assigned teacher, admin, or principal
router.post('/', canManageCourseNotes, courseNoteController.upsertCourseNote);

// Update existing note by ID - only assigned teacher, admin, or principal
router.put('/:id', canManageCourseNotes, courseNoteController.updateCourseNoteById);

// Delete notes - admin/principal only
router.delete('/:id', authorize('admin', 'principal'), courseNoteController.deleteCourseNote);

module.exports = router;


