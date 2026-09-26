const express = require("express");
const saleController = require("../../controllers/inventory/sales");
const authMiddlewares = require('../../middlewares/authMiddlewares');
const checkPermission = require('../../middlewares/checkPermission');

const router = express.Router();

router.use(authMiddlewares.protect);

router
    .route("/")
    .post(checkPermission("Create", "InventorySales"), saleController.createSale)
    .get(checkPermission("Read", "InventorySales"), saleController.getAllSales);

    
router.route("/dashboard").get(checkPermission("Read", "InventorySales"), saleController.dashboardStats);
router.get("/report/date", checkPermission("Read", "InventorySales"), saleController.getSalesReportByDate);
router.get("/report/range", checkPermission("Read", "InventorySales"), saleController.getSalesReportBetweenDates);

router
    .route("/:id")
    .get(checkPermission("Read", "InventorySales"), saleController.getSaleById)
    .put(checkPermission("Edit", "InventorySales"), saleController.updateSale)
    .delete(checkPermission("Delete", "InventorySales"), saleController.deleteSale);

// List products by store, show up to first two batches per product/unit
router.get("/products/:storeId", checkPermission("Read", "InventorySales"), saleController.getProductsByStore);

module.exports = router;