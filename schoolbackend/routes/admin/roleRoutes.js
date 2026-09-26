const express = require('express');

const authMiddlewares = require('../../middlewares/authMiddlewares');
const rolesController = require('../../controllers/admin/rolesController');
const checkPermission = require('../../middlewares/checkPermission');
const router = express.Router();


router.use(authMiddlewares.protect);


// Routes for all academics (GET, POST)
router.route('/')
  .get(checkPermission("Read", "Roles"), rolesController.getRoles)
  .post(checkPermission("Create", "Roles"), rolesController.createRole);

// Routes for specific academic by ID (GET, PUT, DELETE)
router.route('/:id')
  .get(checkPermission("Read", "Roles"), rolesController.getRoleById)
  .put(checkPermission("Edit", "Roles"), rolesController.updateRole)
  .delete(checkPermission("Delete", "Roles"), rolesController.deleteRole);

module.exports = router;