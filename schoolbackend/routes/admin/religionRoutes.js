const express = require('express');
const router = express.Router();
const religionController = require('../../controllers/admin/religionController');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const checkPermission = require('../../middlewares/checkPermission');


// Routes for all religions (GET, POST)
router.route('/')
  .get(authMiddlewares.protect, checkPermission("Read", "Religion"), religionController.getReligions)
  .post(authMiddlewares.protect, checkPermission("Create", "Religion"), religionController.createReligion);

// Routes for specific religion by ID (GET, PUT, DELETE)
router.route('/:id')
  .get(authMiddlewares.protect, checkPermission("Read", "Religion"), religionController.getReligionById)
  .put(authMiddlewares.protect, checkPermission("Edit", "Religion"), religionController.updateReligion)
  .delete(authMiddlewares.protect, checkPermission("Delete", "Religion"), religionController.deleteReligion);

module.exports = router;
