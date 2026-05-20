const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { protectEmployee, requirePermission } = require('../middleware/auth');

router.use(protectEmployee);

router.get('/', requirePermission('employee.read', 'employee.manage'), employeeController.getAllEmployees);
router.get('/:id', requirePermission('employee.read', 'employee.manage'), employeeController.getEmployeeById);
router.post('/', requirePermission('employee.manage'), employeeController.createEmployee);
router.put('/:id', requirePermission('employee.manage'), employeeController.updateEmployee);
router.delete('/:id', requirePermission('employee.manage'), employeeController.deleteEmployee);

module.exports = router;
