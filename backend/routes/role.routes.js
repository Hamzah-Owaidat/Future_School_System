const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { protectEmployee, requirePermission } = require('../middleware/auth');

router.use(protectEmployee);
router.use(requirePermission('role.manage'));

router.get('/', roleController.getAllRoles);
router.get('/:id', roleController.getRoleById);
router.post('/', roleController.createRole);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

module.exports = router;
