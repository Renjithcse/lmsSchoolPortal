const express = require("express");
const router = express.Router();
const subCategoryController = require("../../controllers/inventory/subCategory");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const checkPermission = require("../../middlewares/checkPermission");

// Apply authentication middleware to protect routes
router.use(authMiddlewares.protect);

// Routes for subcategories
router
  .route("/")
  .get(checkPermission("Read", "InventorySubCategory"), subCategoryController.getSubCategories) // Get all subcategories
  .post(checkPermission("Create", "InventorySubCategory"), subCategoryController.createSubCategory); // Create a new subcategory

router
  .route("/:id")
  .put(checkPermission("Edit", "InventorySubCategory"), subCategoryController.updateSubCategory) // Update a subcategory
  .delete(checkPermission("Delete", "InventorySubCategory"), subCategoryController.deleteSubCategory); // Delete a subcategory only if not used in products

  router.get("/:categoryId", checkPermission("Read", "InventorySubCategory"), subCategoryController.getSubCategoriesByCategoryId);

module.exports = router;