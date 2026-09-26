const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const SalaryType = require("../../models/Accounting/salaryType");
const TeacherSalary = require("../../models/Accounting/teacherSalary");

exports.getSalaryTypes = catchAsync(async (req, res) => {
  const { includeInactive } = req.query;

  const filter = {};
  if (!includeInactive || includeInactive === "false") {
    filter.isActive = true;
  }

  const salaryTypes = await SalaryType.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: salaryTypes,
  });
});

exports.getSalaryTypeById = catchAsync(async (req, res, next) => {
  const salaryType = await SalaryType.findById(req.params.id);

  if (!salaryType) {
    return next(new AppError("Salary type not found", 404));
  }

  res.status(200).json({
    success: true,
    data: salaryType,
  });
});

exports.createSalaryType = catchAsync(async (req, res, next) => {
  const { name } = req.body;

  if (!name) {
    return next(new AppError("Salary type name is required", 400));
  }

  const existing = await SalaryType.findOne({ name: new RegExp(`^${name}$`, "i") });
  if (existing) {
    return next(new AppError("Salary type with this name already exists", 400));
  }

  const salaryType = await SalaryType.create(req.body);

  res.status(201).json({
    success: true,
    data: salaryType,
  });
});

exports.updateSalaryType = catchAsync(async (req, res, next) => {
  const { name } = req.body;

  if (name) {
    const existing = await SalaryType.findOne({
      _id: { $ne: req.params.id },
      name: new RegExp(`^${name}$`, "i"),
    });

    if (existing) {
      return next(new AppError("Another salary type with this name already exists", 400));
    }
  }

  const salaryType = await SalaryType.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!salaryType) {
    return next(new AppError("Salary type not found", 404));
  }

  res.status(200).json({
    success: true,
    data: salaryType,
  });
});

exports.toggleSalaryType = catchAsync(async (req, res, next) => {
  const salaryType = await SalaryType.findById(req.params.id);

  if (!salaryType) {
    return next(new AppError("Salary type not found", 404));
  }

  salaryType.isActive = !salaryType.isActive;
  await salaryType.save();

  res.status(200).json({
    success: true,
    data: salaryType,
  });
});

exports.deleteSalaryType = catchAsync(async (req, res, next) => {
  const salaryType = await SalaryType.findById(req.params.id);

  if (!salaryType) {
    return next(new AppError("Salary type not found", 404));
  }

  const usageCount = await TeacherSalary.countDocuments({
    "components.salaryType": salaryType._id,
  });

  if (usageCount > 0) {
    return next(
      new AppError("Cannot delete salary type because it is referenced in salary records", 400)
    );
  }

  await salaryType.deleteOne();

  res.status(200).json({
    success: true,
    message: "Salary type deleted successfully",
  });
});

