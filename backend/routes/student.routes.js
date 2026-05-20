const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protectEmployee, requirePermission } = require('../middleware/auth');

router.use(protectEmployee);

router.get('/', requirePermission('student.read', 'student.manage'), studentController.getAllStudents);
router.get(
  '/next-code',
  requirePermission('student.read', 'student.manage'),
  studentController.getNextStudentCode
);
router.get('/:id', requirePermission('student.read', 'student.manage'), studentController.getStudentById);
router.post('/', requirePermission('student.manage'), studentController.createStudent);
router.put('/:id', requirePermission('student.manage'), studentController.updateStudent);
router.delete('/:id', requirePermission('student.manage'), studentController.deleteStudent);

module.exports = router;
