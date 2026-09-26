const express = require('express');
const router = express.Router();
const authMiddlewares = require('../../middlewares/authMiddlewares');
const rackController = require('../../controllers/library/rackController');
const checkPermission = require('../../middlewares/checkPermission');

// Routes for all racks (GET, POST)
router.route('/')
  .get(authMiddlewares.protect, rackController.getRacks)
  .post(authMiddlewares.protect, checkPermission("Create", "Rack"), rackController.createRack);

// Routes for specific rack by ID (GET, PUT, DELETE)
router.route('/:id')
  .get(authMiddlewares.protect, checkPermission("Read", "Rack"), rackController.getRackById)
  .put(authMiddlewares.protect, checkPermission("Edit", "Rack"), rackController.updateRack)
  .delete(authMiddlewares.protect, checkPermission("Delete", "Rack"), rackController.deleteRack);

// Get rack statistics
router.get('/:id/stats', authMiddlewares.protect, checkPermission("Read", "Rack"), rackController.getRackStats);

module.exports = router;
