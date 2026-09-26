const express = require("express");
const router = express.Router();
const studentFeeController = require("../../controllers/accounting/studentFee");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const checkPermission = require("../../middlewares/checkPermission");

router.use(authMiddlewares.protect);

router
  .route("/")
  .get(checkPermission("Read", "AccountingStudentFees"), studentFeeController.listStudentFees)
  .post(checkPermission("Create", "AccountingStudentFees"), studentFeeController.createStudentFee);

router.post(
  "/bulk",
  checkPermission("Create", "AccountingStudentFees"),
  studentFeeController.bulkCreateStudentFees
);

router
  .route("/:id")
  .get(checkPermission("Read", "AccountingStudentFees"), studentFeeController.getStudentFee)
  .put(checkPermission("Edit", "AccountingStudentFees"), studentFeeController.updateStudentFee)
  .delete(checkPermission("Delete", "AccountingStudentFees"), studentFeeController.deleteStudentFee);

router.post(
  "/:id/payments",
  checkPermission("Create", "AccountingStudentFees"),
  studentFeeController.recordStudentFeePayment
);

router.patch(
  "/:id/cancel",
  checkPermission("Edit", "AccountingStudentFees"),
  studentFeeController.cancelStudentFee
);

module.exports = router;

