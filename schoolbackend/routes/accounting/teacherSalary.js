const express = require("express");
const router = express.Router();
const teacherSalaryController = require("../../controllers/accounting/teacherSalary");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const checkPermission = require("../../middlewares/checkPermission");

router.use(authMiddlewares.protect);

router
  .route("/")
  .get(
    checkPermission("Read", "AccountingTeacherSalaries"),
    teacherSalaryController.listTeacherSalaries
  )
  .post(
    checkPermission("Create", "AccountingTeacherSalaries"),
    teacherSalaryController.createTeacherSalary
  );

router
  .route("/:id")
  .get(
    checkPermission("Read", "AccountingTeacherSalaries"),
    teacherSalaryController.getTeacherSalary
  )
  .put(
    checkPermission("Edit", "AccountingTeacherSalaries"),
    teacherSalaryController.updateTeacherSalary
  )
  .delete(
    checkPermission("Delete", "AccountingTeacherSalaries"),
    teacherSalaryController.deleteTeacherSalary
  );

router.post(
  "/:id/payments",
  checkPermission("Create", "AccountingTeacherSalaries"),
  teacherSalaryController.recordTeacherSalaryPayment
);

router.patch(
  "/:id/cancel",
  checkPermission("Edit", "AccountingTeacherSalaries"),
  teacherSalaryController.cancelTeacherSalary
);

module.exports = router;

