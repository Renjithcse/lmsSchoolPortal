const express = require("express");
const router = express.Router();
const transactionController = require("../../controllers/accounting/transaction");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const checkPermission = require("../../middlewares/checkPermission");

router.use(authMiddlewares.protect);

router.get(
  "/summary",
  checkPermission("Read", "AccountingTransactions"),
  transactionController.getTransactionSummary
);

router
  .route("/")
  .get(
    checkPermission("Read", "AccountingTransactions"),
    transactionController.listTransactions
  );

router.post(
  "/adjustments",
  checkPermission("Create", "AccountingTransactions"),
  transactionController.createAdjustmentTransaction
);

router.get(
  "/:id",
  checkPermission("Read", "AccountingTransactions"),
  transactionController.getTransactionById
);

module.exports = router;

