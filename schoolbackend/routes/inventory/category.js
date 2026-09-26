const express = require("express");
const router = express.Router();
const categoryController = require("../../controllers/inventory/category");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const checkPermission = require("../../middlewares/checkPermission");

// Apply `authMiddlewares.protect` to all routes
router.use(authMiddlewares.protect);

// Routes for categories
router
  .route("/")
  .get(checkPermission("Read", "InventoryCategory"), categoryController.getCategories) // Get all categories
  .post(checkPermission("Create", "InventoryCategory"), categoryController.createCategory); // Create a new category

router
  .route("/:id")
  .get(checkPermission("Read", "InventoryCategory"), categoryController.getCategoryById) // Get a single category by ID
  .put(checkPermission("Edit", "InventoryCategory"), categoryController.updateCategory) // Update a category
  .delete(checkPermission("Delete", "InventoryCategory"), categoryController.deleteCategory); // Delete a category

module.exports = router;