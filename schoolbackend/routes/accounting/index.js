const express = require("express");
const router = express.Router();

const feeTypeRoutes = require("./feeType");
const studentFeeRoutes = require("./studentFee");
const salaryTypeRoutes = require("./salaryType");
const teacherSalaryRoutes = require("./teacherSalary");
const expenseHeadRoutes = require("./expenseHead");
const expenseRoutes = require("./expense");
const transactionRoutes = require("./transaction");

router.use("/fee-types", feeTypeRoutes);
router.use("/student-fees", studentFeeRoutes);
router.use("/salary-types", salaryTypeRoutes);
router.use("/teacher-salaries", teacherSalaryRoutes);
router.use("/expense-heads", expenseHeadRoutes);
router.use("/expenses", expenseRoutes);
router.use("/transactions", transactionRoutes);

module.exports = router;

