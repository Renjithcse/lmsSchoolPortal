const express = require("express");
const storeController = require("../../controllers/inventory/store");
const authMiddlewares = require('../../middlewares/authMiddlewares');
const checkPermission = require('../../middlewares/checkPermission');

const router = express.Router();

router.use(authMiddlewares.protect);

// Store routes
router
    .route("/")
    .post(checkPermission("Create", "InventoryStore"), storeController.createStore) // Create a new store
    .get(checkPermission("Read", "InventoryStore"), storeController.getAllStores); // Get all stores

router
    .route("/:id")
    .get(checkPermission("Read", "InventoryStore"), storeController.getStoreById) // Get a single store by ID
    .put(checkPermission("Edit", "InventoryStore"), storeController.updateStore) // Update a store
    .delete(checkPermission("Delete", "InventoryStore"), storeController.deleteStore); // Delete a store

module.exports = router;