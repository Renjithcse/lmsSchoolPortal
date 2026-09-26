

const express = require("express");
const authMiddlewares = require('../../middlewares/authMiddlewares');
const checkPermission = require('../../middlewares/checkPermission');

const purchaseController = require("../../controllers/inventory/purchase");


const router = express.Router();

router.use(authMiddlewares.protect);

router
    .route("/")
    .post(checkPermission("Create", "InventoryPurchase"), purchaseController.createPurchase) // Create a new purchase
    .get(checkPermission("Read", "InventoryPurchase"), purchaseController.getAllPurchases); // Get all purchases

//get all stocks
router.get("/stocks", checkPermission("Read", "InventoryPurchase"), purchaseController.getAllStocks);

router
    .route("/:id")
    .get(checkPermission("Read", "InventoryPurchase"), purchaseController.getPurchaseById) // Get a single purchase by ID
    .put(checkPermission("Edit", "InventoryPurchase"), purchaseController.updatePurchase) // Update a purchase
    .delete(checkPermission("Delete", "InventoryPurchase"), purchaseController.deletePurchase); // Delete a purchase


module.exports = router;

// http://localhost:4000/api/purchase/add POST
// http://localhost:4000/api/purchase/get GET
