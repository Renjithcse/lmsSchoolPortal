const mongoose = require("mongoose");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const Expense = require("../../models/Accounting/expense");
const ExpenseHead = require("../../models/Accounting/expenseHead");
const AccountTransaction = require("../../models/Accounting/accountTransaction");

const buildExpenseFilter = (query) => {
  const filters = {};

  if (query.expenseHead) {
    filters.expenseHead = query.expenseHead;
  }

  if (query.status) {
    filters.status = { $in: Array.isArray(query.status) ? query.status : [query.status] };
  }

  if (query.minAmount || query.maxAmount) {
    filters.amount = {};
    if (query.minAmount) {
      filters.amount.$gte = Number(query.minAmount);
    }
    if (query.maxAmount) {
      filters.amount.$lte = Number(query.maxAmount);
    }
  }

  if (query.fromDate || query.toDate) {
    filters.expenseDate = {};
    if (query.fromDate) {
      filters.expenseDate.$gte = new Date(query.fromDate);
    }
    if (query.toDate) {
      filters.expenseDate.$lte = new Date(query.toDate);
    }
  }

  return filters;
};

exports.listExpenses = catchAsync(async (req, res) => {
  const { page = 1, limit = 25 } = req.query;
  const filters = buildExpenseFilter(req.query);

  const [items, total] = await Promise.all([
    Expense.find(filters)
      .populate("expenseHead")
      .populate("recordedBy", ["name", "email"])
      .sort({ expenseDate: -1, createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    Expense.countDocuments(filters),
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

exports.getExpenseById = catchAsync(async (req, res, next) => {
  const expense = await Expense.findById(req.params.id)
    .populate("expenseHead")
    .populate("transaction")
    .populate("recordedBy", ["name", "email"]);

  if (!expense) {
    return next(new AppError("Expense not found", 404));
  }

  res.status(200).json({
    success: true,
    data: expense,
  });
});

exports.createExpense = catchAsync(async (req, res, next) => {
  const { expenseHead, amount } = req.body;

  if (!expenseHead || !mongoose.Types.ObjectId.isValid(expenseHead)) {
    return next(new AppError("Valid expense head id is required", 400));
  }

  if (typeof amount !== "number" || amount <= 0) {
    return next(new AppError("Expense amount must be greater than zero", 400));
  }

  const expenseHeadDoc = await ExpenseHead.findById(expenseHead);
  if (!expenseHeadDoc || !expenseHeadDoc.isActive) {
    return next(new AppError("Expense head not found or inactive", 400));
  }

  const expenseDate = req.body.expenseDate ? new Date(req.body.expenseDate) : new Date();

  const expense = await Expense.create({
    ...req.body,
    expenseDate,
    recordedBy: req.user ? req.user.id : undefined,
    status: req.body.status || "paid",
  });

  if (expense.status !== "cancelled") {
    const transaction = await AccountTransaction.create({
      transactionType: "EXPENSE_PAYMENT",
      direction: "debit",
      amount,
      transactionDate: expenseDate,
      paymentMethod: req.body.paymentMethod,
      referenceNumber: req.body.referenceNumber,
      narration: `Expense recorded against head ${expenseHeadDoc.name}`,
      expense: expense._id,
      createdBy: req.user ? req.user.id : undefined,
    });

    expense.transaction = transaction._id;
    await expense.save();
  }

  res.status(201).json({
    success: true,
    data: expense,
  });
});

exports.updateExpense = catchAsync(async (req, res, next) => {
  const disallowedFields = ["transaction", "recordedBy"];
  disallowedFields.forEach((field) => delete req.body[field]);

  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    return next(new AppError("Expense not found", 404));
  }

  if (req.body.expenseHead) {
    if (!mongoose.Types.ObjectId.isValid(req.body.expenseHead)) {
      return next(new AppError("Valid expense head id is required", 400));
    }
    const expenseHeadDoc = await ExpenseHead.findById(req.body.expenseHead);
    if (!expenseHeadDoc || !expenseHeadDoc.isActive) {
      return next(new AppError("Expense head not found or inactive", 400));
    }
  }

  const updatedExpense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (
    updatedExpense.transaction &&
    (typeof req.body.amount === "number" ||
      req.body.paymentMethod ||
      req.body.referenceNumber ||
      req.body.expenseDate ||
      req.body.notes)
  ) {
    const transaction = await AccountTransaction.findById(updatedExpense.transaction);
    if (transaction) {
      if (typeof req.body.amount === "number" && req.body.amount > 0) {
        transaction.amount = req.body.amount;
      }
      if (req.body.paymentMethod) {
        transaction.paymentMethod = req.body.paymentMethod;
      }
      if (req.body.referenceNumber) {
        transaction.referenceNumber = req.body.referenceNumber;
      }
      if (req.body.expenseDate) {
        transaction.transactionDate = new Date(req.body.expenseDate);
      }
      if (req.body.notes) {
        transaction.narration = req.body.notes;
      }
      await transaction.save();
    }
  }

  res.status(200).json({
    success: true,
    data: updatedExpense,
  });
});

exports.cancelExpense = catchAsync(async (req, res, next) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    return next(new AppError("Expense not found", 404));
  }

  if (expense.status === "cancelled") {
    return next(new AppError("Expense is already cancelled", 400));
  }

  expense.status = "cancelled";
  await expense.save();

  if (expense.transaction) {
    const transaction = await AccountTransaction.findById(expense.transaction);
    if (transaction) {
      transaction.meta = { ...transaction.meta, cancelled: true };
      transaction.narration = `${transaction.narration || ""} (cancelled)`.trim();
      await transaction.save();
    }
  }

  res.status(200).json({
    success: true,
    data: expense,
  });
});

exports.deleteExpense = catchAsync(async (req, res, next) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    return next(new AppError("Expense not found", 404));
  }

  if (expense.transaction) {
    await AccountTransaction.deleteOne({ _id: expense.transaction });
  }

  await expense.deleteOne();

  res.status(200).json({
    success: true,
    message: "Expense deleted successfully",
  });
});

