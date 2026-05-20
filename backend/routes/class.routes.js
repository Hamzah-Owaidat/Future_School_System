const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { protectEmployee, requirePermission } = require('../middleware/auth');

router.use(protectEmployee);

router.get('/', requirePermission('class.read', 'class.manage'), classController.getAllClasses);
router.get('/:id', requirePermission('class.read', 'class.manage'), classController.getClassById);
router.post('/', requirePermission('class.manage'), classController.createClass);
router.put('/:id', requirePermission('class.manage'), classController.updateClass);
router.delete('/:id', requirePermission('class.manage'), classController.deleteClass);

module.exports = router;
