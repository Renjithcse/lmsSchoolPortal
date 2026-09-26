const express = require("express");
const router = express.Router();
const productController = require("../../controllers/inventory/product");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const checkPermission = require("../../middlewares/checkPermission");

// Apply `authMiddlewares.protect` to all routes in this router
router.use(authMiddlewares.protect);

// Grouped routes for `/api/products`
router
    .route("/")
    .get(checkPermission("Read", "InventoryProducts"), productController.getProducts) // Get all products
    .post(checkPermission("Create", "InventoryProducts"), productController.createProduct); // Create a new product

router
    .route("/:id")
    .get(checkPermission("Read", "InventoryProducts"), productController.getProductById) // Get a single product by ID
    .put(checkPermission("Edit", "InventoryProducts"), productController.updateProduct) // Update a product by ID
    .delete(checkPermission("Delete", "InventoryProducts"), productController.deleteProduct); // Delete a product by ID

module.exports = router;