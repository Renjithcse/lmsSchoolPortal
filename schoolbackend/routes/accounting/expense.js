const express = require("express");
const router = express.Router();
const expenseController = require("../../controllers/accounting/expense");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const checkPermission = require("../../middlewares/checkPermission");

router.use(authMiddlewares.protect);

router
  .route("/")
  .get(checkPermission("Read", "AccountingExpenses"), expenseController.listExpenses)
  .post(checkPermission("Create", "AccountingExpenses"), expenseController.createExpense);

router
  .route("/:id")
  .get(checkPermission("Read", "AccountingExpenses"), expenseController.getExpenseById)
  .put(checkPermission("Edit", "AccountingExpenses"), expenseController.updateExpense)
  .delete(checkPermission("Delete", "AccountingExpenses"), expenseController.deleteExpense);

router.patch(
  "/:id/cancel",
  checkPermission("Edit", "AccountingExpenses"),
  expenseController.cancelExpense
);

module.exports = router;

