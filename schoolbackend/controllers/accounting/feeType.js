const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const FeeType = require("../../models/Accounting/feeType");
const StudentFee = require("../../models/Accounting/studentFee");

exports.getFeeTypes = catchAsync(async (req, res) => {
  const { includeInactive } = req.query;

  const filter = {};
  if (!includeInactive || includeInactive === "false") {
    filter.isActive = true;
  }

  const feeTypes = await FeeType.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: feeTypes,
  });
});

exports.getFeeTypeById = catchAsync(async (req, res, next) => {
  const feeType = await FeeType.findById(req.params.id);

  if (!feeType) {
    return next(new AppError("Fee type not found", 404));
  }

  res.status(200).json({
    success: true,
    data: feeType,
  });
});

exports.createFeeType = catchAsync(async (req, res, next) => {
  const { name, description, defaultAmount, isActive } = req.body;

  const existing = await FeeType.findOne({ name: new RegExp(`^${name}$`, "i") });
  if (existing) {
    return next(new AppError("Fee type with this name already exists", 400));
  }

  const feeType = await FeeType.create({
    name,
    description,
    defaultAmount,
    isActive,
  });

  res.status(201).json({
    success: true,
    data: feeType,
  });
});

exports.updateFeeType = catchAsync(async (req, res, next) => {
  const { name } = req.body;

  if (name) {
    const existing = await FeeType.findOne({
      _id: { $ne: req.params.id },
      name: new RegExp(`^${name}$`, "i"),
    });

    if (existing) {
      return next(new AppError("Another fee type with this name already exists", 400));
    }
  }

  const feeType = await FeeType.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!feeType) {
    return next(new AppError("Fee type not found", 404));
  }

  res.status(200).json({
    success: true,
    data: feeType,
  });
});

exports.toggleFeeType = catchAsync(async (req, res, next) => {
  const feeType = await FeeType.findById(req.params.id);

  if (!feeType) {
    return next(new AppError("Fee type not found", 404));
  }

  feeType.isActive = !feeType.isActive;
  await feeType.save();

  res.status(200).json({
    success: true,
    data: feeType,
  });
});

exports.deleteFeeType = catchAsync(async (req, res, next) => {
  const feeType = await FeeType.findById(req.params.id);

  if (!feeType) {
    return next(new AppError("Fee type not found", 404));
  }

  const linkedFees = await StudentFee.countDocuments({ feeType: feeType._id });
  if (linkedFees > 0) {
    return next(
      new AppError("Cannot delete fee type because it is in use. Consider deactivating instead.", 400)
    );
  }

  await FeeType.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Fee type deleted successfully",
  });
});

