const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { protectEmployee, requirePermission } = require('../middleware/auth');

router.use(protectEmployee);
router.use(requirePermission('permission.manage'));

router.get('/', permissionController.getAllPermissions);
router.get('/grouped', permissionController.getGroupedPermissions);
router.get('/:id', permissionController.getPermissionById);
router.post('/', permissionController.createPermission);
router.put('/:id', permissionController.updatePermission);
router.delete('/:id', permissionController.deletePermission);

module.exports = router;
