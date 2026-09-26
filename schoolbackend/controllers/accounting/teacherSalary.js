const mongoose = require("mongoose");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const TeacherSalary = require("../../models/Accounting/teacherSalary");
const SalaryType = require("../../models/Accounting/salaryType");
const AccountTransaction = require("../../models/Accounting/accountTransaction");

const validateSalaryComponents = async (components = []) => {
  if (!components.length) {
    return { components, total: 0 };
  }

  const salaryTypeIds = components.map((item) => item.salaryType);
  const uniqueSalaryTypeIds = [...new Set(salaryTypeIds.map((id) => id.toString()))];

  const existingTypesCount = await SalaryType.countDocuments({
    _id: { $in: uniqueSalaryTypeIds },
    isActive: true,
  });

  if (existingTypesCount !== uniqueSalaryTypeIds.length) {
    throw new AppError("One or more salary types are invalid or inactive", 400);
  }

  const normalizedComponents = components.map((component) => {
    if (!mongoose.Types.ObjectId.isValid(component.salaryType)) {
      throw new AppError("Invalid salary type id in components", 400);
    }
    if (typeof component.amount !== "number" || component.amount < 0) {
      throw new AppError("Component amount must be a non-negative number", 400);
    }

    return {
      salaryType: component.salaryType,
      amount: component.amount,
      notes: component.notes,
    };
  });

  const total = normalizedComponents.reduce((sum, component) => sum + component.amount, 0);

  return { components: normalizedComponents, total };
};

exports.listTeacherSalaries = catchAsync(async (req, res) => {
  const {
    teacher,
    status,
    payrollYear,
    payrollMonth,
    page = 1,
    limit = 25,
  } = req.query;

  const filters = {};

  if (teacher) {
    filters.teacher = teacher;
  }

  if (status) {
    filters.status = { $in: Array.isArray(status) ? status : [status] };
  }

  if (payrollYear) {
    filters.payrollYear = payrollYear;
  }

  if (payrollMonth) {
    filters.payrollMonth = payrollMonth;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    TeacherSalary.find(filters)
      .populate("teacher", ["employeeName", "employeeId", "email"])
      .populate("components.salaryType")
      .sort({ payrollYear: -1, payrollMonth: -1 })
      .skip(skip)
      .limit(Number(limit)),
    TeacherSalary.countDocuments(filters),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
    },
  });
});

exports.getTeacherSalary = catchAsync(async (req, res, next) => {
  const salary = await TeacherSalary.findById(req.params.id)
    .populate("teacher", ["employeeName", "employeeId", "email"])
    .populate("components.salaryType")
    .populate("transaction");

  if (!salary) {
    return next(new AppError("Teacher salary record not found", 404));
  }

  res.status(200).json({
    success: true,
    data: salary,
  });
});

exports.createTeacherSalary = catchAsync(async (req, res, next) => {
  const { teacher, payrollMonth, payrollYear, components, totalAmount } = req.body;

  if (!teacher || !mongoose.Types.ObjectId.isValid(teacher)) {
    return next(new AppError("Valid teacher id is required", 400));
  }

  if (!payrollMonth || payrollMonth < 1 || payrollMonth > 12) {
    return next(new AppError("Payroll month must be between 1 and 12", 400));
  }

  if (!payrollYear) {
    return next(new AppError("Payroll year is required", 400));
  }

  const { components: normalizedComponents, total } = await validateSalaryComponents(components);

  let computedTotal = total;
  if (typeof totalAmount === "number" && totalAmount >= 0) {
    computedTotal = totalAmount;
    if (normalizedComponents.length && total !== totalAmount) {
      computedTotal = total;
    }
  }

  const salaryRecord = await TeacherSalary.create({
    ...req.body,
    components: normalizedComponents,
    totalAmount: computedTotal,
    status: req.body.status || "approved",
  });

  res.status(201).json({
    success: true,
    data: salaryRecord,
  });
});

exports.updateTeacherSalary = catchAsync(async (req, res, next) => {
  const disallowedUpdates = ["paidAmount", "transaction", "status"];
  disallowedUpdates.forEach((field) => delete req.body[field]);

  let normalizedComponents;
  let computedTotal;
  if (req.body.components) {
    const result = await validateSalaryComponents(req.body.components);
    normalizedComponents = result.components;
    computedTotal = result.total;
    req.body.totalAmount =
      typeof req.body.totalAmount === "number" && req.body.totalAmount >= 0
        ? req.body.totalAmount
        : computedTotal;

    if (normalizedComponents.length && req.body.totalAmount !== computedTotal) {
      req.body.totalAmount = computedTotal;
    }
    req.body.components = normalizedComponents;
  }

  const salaryRecord = await TeacherSalary.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!salaryRecord) {
    return next(new AppError("Teacher salary record not found", 404));
  }

  res.status(200).json({
    success: true,
    data: salaryRecord,
  });
});

exports.recordTeacherSalaryPayment = catchAsync(async (req, res, next) => {
  const { amount, paymentDate, paymentMethod, referenceNumber, notes } = req.body;

  if (typeof amount !== "number" || amount <= 0) {
    return next(new AppError("Payment amount must be greater than zero", 400));
  }

  const salaryRecord = await TeacherSalary.findById(req.params.id);

  if (!salaryRecord) {
    return next(new AppError("Teacher salary record not found", 404));
  }

  if (salaryRecord.status === "cancelled") {
    return next(new AppError("Cannot record payment for a cancelled salary entry", 400));
  }

  if (salaryRecord.status === "paid") {
    return next(new AppError("This salary has already been fully paid", 400));
  }

  const remaining = salaryRecord.totalAmount - salaryRecord.paidAmount;
  if (amount > remaining) {
    return next(
      new AppError(`Payment exceeds remaining salary amount. Remaining balance is ${remaining}`, 400)
    );
  }

  const paymentDateValue = paymentDate ? new Date(paymentDate) : new Date();

  const transaction = await AccountTransaction.create({
    transactionType: "SALARY_PAYMENT",
    direction: "debit",
    amount,
    transactionDate: paymentDateValue,
    paymentMethod,
    referenceNumber,
    narration: `Salary payment for teacher ${salaryRecord.teacher}`,
    teacherSalary: salaryRecord._id,
    createdBy: req.user ? req.user.id : undefined,
    meta: { payrollMonth: salaryRecord.payrollMonth, payrollYear: salaryRecord.payrollYear },
  });

  salaryRecord.paidAmount += amount;
  salaryRecord.paymentDate = paymentDateValue;
  salaryRecord.paymentMethod = paymentMethod;
  salaryRecord.referenceNumber = referenceNumber;
  salaryRecord.transaction = transaction._id;
  salaryRecord.notes = notes || salaryRecord.notes;

  salaryRecord.status =
    salaryRecord.paidAmount === salaryRecord.totalAmount ? "paid" : "partially_paid";

  await salaryRecord.save();

  res.status(201).json({
    success: true,
    data: salaryRecord,
  });
});

exports.cancelTeacherSalary = catchAsync(async (req, res, next) => {
  const salaryRecord = await TeacherSalary.findById(req.params.id);

  if (!salaryRecord) {
    return next(new AppError("Teacher salary record not found", 404));
  }

  if (salaryRecord.status === "paid") {
    return next(new AppError("Cannot cancel a salary record that is already paid", 400));
  }

  salaryRecord.status = "cancelled";
  await salaryRecord.save();

  res.status(200).json({
    success: true,
    data: salaryRecord,
  });
});

exports.deleteTeacherSalary = catchAsync(async (req, res, next) => {
  const salaryRecord = await TeacherSalary.findById(req.params.id);

  if (!salaryRecord) {
    return next(new AppError("Teacher salary record not found", 404));
  }

  if (salaryRecord.paidAmount > 0) {
    return next(new AppError("Cannot delete a salary record that has payments. Cancel instead.", 400));
  }

  if (salaryRecord.transaction) {
    await AccountTransaction.deleteOne({ _id: salaryRecord.transaction });
  }

  await salaryRecord.deleteOne();

  res.status(200).json({
    success: true,
    message: "Teacher salary record deleted successfully",
  });
});

