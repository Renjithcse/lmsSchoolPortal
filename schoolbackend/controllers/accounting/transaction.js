const mongoose = require("mongoose");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const AccountTransaction = require("../../models/Accounting/accountTransaction");

const buildTransactionFilters = (query) => {
  const filters = {};

  if (query.transactionType) {
    filters.transactionType = Array.isArray(query.transactionType)
      ? { $in: query.transactionType }
      : query.transactionType;
  }

  if (query.direction) {
    filters.direction = query.direction;
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
    filters.transactionDate = {};
    if (query.fromDate) {
      filters.transactionDate.$gte = new Date(query.fromDate);
    }
    if (query.toDate) {
      filters.transactionDate.$lte = new Date(query.toDate);
    }
  }

  if (query.studentFee) {
    filters.studentFee = query.studentFee;
  }

  if (query.teacherSalary) {
    filters.teacherSalary = query.teacherSalary;
  }

  if (query.expense) {
    filters.expense = query.expense;
  }

  if (query.referenceNumber) {
    filters.referenceNumber = query.referenceNumber;
  }

  return filters;
};

exports.listTransactions = catchAsync(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const filters = buildTransactionFilters(req.query);

  const [transactions, total] = await Promise.all([
    AccountTransaction.find(filters)
      .populate("studentFee")
      .populate("teacherSalary")
      .populate("expense")
      .populate("createdBy", ["name", "email"])
      .sort({ transactionDate: -1, createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    AccountTransaction.countDocuments(filters),
  ]);

  res.status(200).json({
    success: true,
    data: transactions,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
    },
  });
});

exports.getTransactionById = catchAsync(async (req, res, next) => {
  const transaction = await AccountTransaction.findById(req.params.id)
    .populate("studentFee")
    .populate("teacherSalary")
    .populate("expense")
    .populate("createdBy", ["name", "email"]);

  if (!transaction) {
    return next(new AppError("Transaction not found", 404));
  }

  res.status(200).json({
    success: true,
    data: transaction,
  });
});

exports.createAdjustmentTransaction = catchAsync(async (req, res, next) => {
  const { transactionType, direction, amount, transactionDate } = req.body;

  if (!transactionType) {
    return next(new AppError("Transaction type is required", 400));
  }

  if (!direction) {
    return next(new AppError("Transaction direction is required", 400));
  }

  if (typeof amount !== "number" || amount <= 0) {
    return next(new AppError("Amount must be greater than zero", 400));
  }

  const transaction = await AccountTransaction.create({
    ...req.body,
    transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
    createdBy: req.user ? req.user.id : undefined,
  });

  res.status(201).json({
    success: true,
    data: transaction,
  });
});

exports.getTransactionSummary = catchAsync(async (req, res) => {
  const filters = buildTransactionFilters(req.query);

  const aggregationPipeline = [
    { $match: filters },
    {
      $group: {
        _id: "$direction",
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ];

  const summary = await AccountTransaction.aggregate(aggregationPipeline);

  const credit = summary.find((item) => item._id === "credit") || { totalAmount: 0, count: 0 };
  const debit = summary.find((item) => item._id === "debit") || { totalAmount: 0, count: 0 };

  res.status(200).json({
    success: true,
    data: {
      credit: {
        amount: credit.totalAmount,
        count: credit.count,
      },
      debit: {
        amount: debit.totalAmount,
        count: debit.count,
      },
      balance: credit.totalAmount - debit.totalAmount,
    },
  });
});

