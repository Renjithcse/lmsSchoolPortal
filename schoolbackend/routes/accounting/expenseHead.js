const express = require("express");
const router = express.Router();
const expenseHeadController = require("../../controllers/accounting/expenseHead");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const checkPermission = require("../../middlewares/checkPermission");

router.use(authMiddlewares.protect);

router
  .route("/")
  .get(checkPermission("Read", "AccountingExpenseHeads"), expenseHeadController.getExpenseHeads)
  .post(
    checkPermission("Create", "AccountingExpenseHeads"),
    expenseHeadController.createExpenseHead
  );

router
  .route("/:id")
  .get(checkPermission("Read", "AccountingExpenseHeads"), expenseHeadController.getExpenseHeadById)
  .put(checkPermission("Edit", "AccountingExpenseHeads"), expenseHeadController.updateExpenseHead)
  .delete(
    checkPermission("Delete", "AccountingExpenseHeads"),
    expenseHeadController.deleteExpenseHead
  );

router.patch(
  "/:id/toggle",
  checkPermission("Edit", "AccountingExpenseHeads"),
  expenseHeadController.toggleExpenseHead
);

module.exports = router;

