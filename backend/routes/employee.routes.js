const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// All routes require admin or principal role
router.get('/', authorize('admin', 'principal'), employeeController.getAllEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.post('/', authorize('admin'), employeeController.createEmployee);
router.put('/:id', authorize('admin'), employeeController.updateEmployee);
router.delete('/:id', authorize('admin'), employeeController.deleteEmployee);

module.exports = router;

