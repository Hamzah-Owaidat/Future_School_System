const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/', permissionController.getAllPermissions);
router.get('/grouped', permissionController.getGroupedPermissions);
router.get('/:id', permissionController.getPermissionById);
router.post('/', permissionController.createPermission);
router.put('/:id', permissionController.updatePermission);
router.delete('/:id', permissionController.deletePermission);

module.exports = router;

