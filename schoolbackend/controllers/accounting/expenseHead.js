const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const ExpenseHead = require("../../models/Accounting/expenseHead");
const Expense = require("../../models/Accounting/expense");

exports.getExpenseHeads = catchAsync(async (req, res) => {
  const { includeInactive } = req.query;

  const filter = {};
  if (!includeInactive || includeInactive === "false") {
    filter.isActive = true;
  }

  const expenseHeads = await ExpenseHead.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: expenseHeads,
  });
});

exports.getExpenseHeadById = catchAsync(async (req, res, next) => {
  const expenseHead = await ExpenseHead.findById(req.params.id);

  if (!expenseHead) {
    return next(new AppError("Expense head not found", 404));
  }

  res.status(200).json({
    success: true,
    data: expenseHead,
  });
});

exports.createExpenseHead = catchAsync(async (req, res, next) => {
  const { name } = req.body;

  if (!name) {
    return next(new AppError("Expense head name is required", 400));
  }

  const existing = await ExpenseHead.findOne({ name: new RegExp(`^${name}$`, "i") });
  if (existing) {
    return next(new AppError("Expense head with this name already exists", 400));
  }

  const expenseHead = await ExpenseHead.create(req.body);

  res.status(201).json({
    success: true,
    data: expenseHead,
  });
});

exports.updateExpenseHead = catchAsync(async (req, res, next) => {
  const { name } = req.body;

  if (name) {
    const existing = await ExpenseHead.findOne({
      _id: { $ne: req.params.id },
      name: new RegExp(`^${name}$`, "i"),
    });

    if (existing) {
      return next(new AppError("Another expense head with this name already exists", 400));
    }
  }

  const expenseHead = await ExpenseHead.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!expenseHead) {
    return next(new AppError("Expense head not found", 404));
  }

  res.status(200).json({
    success: true,
    data: expenseHead,
  });
});

exports.toggleExpenseHead = catchAsync(async (req, res, next) => {
  const expenseHead = await ExpenseHead.findById(req.params.id);

  if (!expenseHead) {
    return next(new AppError("Expense head not found", 404));
  }

  expenseHead.isActive = !expenseHead.isActive;
  await expenseHead.save();

  res.status(200).json({
    success: true,
    data: expenseHead,
  });
});

exports.deleteExpenseHead = catchAsync(async (req, res, next) => {
  const expenseHead = await ExpenseHead.findById(req.params.id);

  if (!expenseHead) {
    return next(new AppError("Expense head not found", 404));
  }

  const usageCount = await Expense.countDocuments({ expenseHead: expenseHead._id });
  if (usageCount > 0) {
    return next(
      new AppError("Cannot delete expense head because it is referenced in expense records", 400)
    );
  }

  await expenseHead.deleteOne();

  res.status(200).json({
    success: true,
    message: "Expense head deleted successfully",
  });
});

