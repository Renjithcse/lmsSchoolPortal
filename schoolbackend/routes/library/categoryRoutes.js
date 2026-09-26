const express = require('express');
const router = express.Router();
const authMiddlewares = require('../../middlewares/authMiddlewares');
const categoryController = require('../../controllers/library/categoryController');
const checkPermission = require('../../middlewares/checkPermission');

// Get all categories
router.get('/', authMiddlewares.protect, checkPermission("Read", "LibraryCategories"), categoryController.getCategories);

// Get a single category
router.get('/:id', authMiddlewares.protect, checkPermission("Read", "LibraryCategories"), categoryController.getCategoryById);

// Create a new category
router.post('/', authMiddlewares.protect, checkPermission("Create", "LibraryCategories"), categoryController.createCategory);

// Update a category
router.put('/:id', authMiddlewares.protect, checkPermission("Update", "LibraryCategories"), categoryController.updateCategory);

// Delete a category
router.delete('/:id', authMiddlewares.protect, checkPermission("Delete", "LibraryCategories"), categoryController.deleteCategory);

module.exports = router;
