const mongoose = require("mongoose");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const StudentFee = require("../../models/Accounting/studentFee");
const Student = require("../../models/users/Student");
const FeeType = require("../../models/Accounting/feeType");
const AccountTransaction = require("../../models/Accounting/accountTransaction");

const buildStudentFeeFilters = (query) => {
  const filters = {};

  if (query.student) {
    filters.student = query.student;
  }

  if (query.feeType) {
    filters.feeType = query.feeType;
  }

  if (query.status) {
    filters.status = { $in: Array.isArray(query.status) ? query.status : [query.status] };
  }

  if (query.academicYear) {
    filters.academicYear = query.academicYear;
  }

  if (query.term) {
    filters.term = query.term;
  }

  if (query.fromDueDate || query.toDueDate) {
    filters.dueDate = {};
    if (query.fromDueDate) {
      filters.dueDate.$gte = new Date(query.fromDueDate);
    }
    if (query.toDueDate) {
      filters.dueDate.$lte = new Date(query.toDueDate);
    }
  }

  return filters;
};

const normalizeObjectIdArray = (values = []) => {
  const array = Array.isArray(values) ? values : [values];
  const unique = [...new Set(array.map((value) => String(value)))];
  return unique
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
};

const normalizeGenderArray = (values = []) => {
  const array = Array.isArray(values) ? values : [values];
  const allowed = ["male", "female", "other"];
  return [...new Set(array.map((value) => String(value).toLowerCase()))].filter((gender) =>
    allowed.includes(gender)
  );
};

exports.listStudentFees = catchAsync(async (req, res) => {
  const filters = buildStudentFeeFilters(req.query);
  const { page = 1, limit = 25 } = req.query;

  const [fees, total] = await Promise.all([
    StudentFee.find(filters)
      .populate("student", ["studentName", "admissionNo", "email"])
      .populate("feeType")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    StudentFee.countDocuments(filters),
  ]);

  res.status(200).json({
    success: true,
    data: fees,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
    },
  });
});

exports.getStudentFee = catchAsync(async (req, res, next) => {
  const fee = await StudentFee.findById(req.params.id)
    .populate("student", ["studentName", "admissionNo", "email"])
    .populate("feeType")
    .lean();

  if (!fee) {
    return next(new AppError("Student fee record not found", 404));
  }

  res.status(200).json({
    success: true,
    data: fee,
  });
});

exports.createStudentFee = catchAsync(async (req, res, next) => {
  const { student, feeType, amountDue } = req.body;

  if (!student || !mongoose.Types.ObjectId.isValid(student)) {
    return next(new AppError("Valid student id is required", 400));
  }

  if (!feeType || !mongoose.Types.ObjectId.isValid(feeType)) {
    return next(new AppError("Valid fee type id is required", 400));
  }

  if (typeof amountDue !== "number" || amountDue < 0) {
    return next(new AppError("Amount due must be a non-negative number", 400));
  }

  const feeTypeDoc = await FeeType.findById(feeType);
  if (!feeTypeDoc) {
    return next(new AppError("Fee type not found", 404));
  }

  const studentFee = await StudentFee.create({
    ...req.body,
    status: req.body.status || (amountDue === 0 ? "paid" : "pending"),
  });

  res.status(201).json({
    success: true,
    data: studentFee,
  });
});

exports.bulkCreateStudentFees = catchAsync(async (req, res, next) => {
  const {
    feeType: feeTypeId,
    academicYear,
    term,
    amountDue,
    dueDate,
    notes,
    gradeIds = [],
    genders = [],
    sectionIds = [],
    studentIds = [],
  } = req.body;

  if (!academicYear) {
    return next(new AppError("Academic year is required", 400));
  }

  if (!feeTypeId || !mongoose.Types.ObjectId.isValid(feeTypeId)) {
    return next(new AppError("Valid fee type id is required", 400));
  }

  const feeType = await FeeType.findById(feeTypeId);
  if (!feeType) {
    return next(new AppError("Fee type not found", 404));
  }

  const normalizedStudentIds = normalizeObjectIdArray(studentIds);
  const normalizedGradeIds = normalizeObjectIdArray(gradeIds);
  const normalizedSectionIds = normalizeObjectIdArray(sectionIds);
  const normalizedGenders = normalizeGenderArray(genders);

  if (
    !normalizedStudentIds.length &&
    !normalizedGradeIds.length &&
    !normalizedSectionIds.length &&
    !normalizedGenders.length
  ) {
    return next(
      new AppError(
        "Please provide at least one of the following filters: students, grades, genders, or sections",
        400
      )
    );
  }

  const studentQuery = {};
  if (normalizedStudentIds.length) {
    studentQuery._id = { $in: normalizedStudentIds };
  }
  if (normalizedGradeIds.length) {
    studentQuery.grade = { $in: normalizedGradeIds };
  }
  if (normalizedSectionIds.length) {
    studentQuery.section = { $in: normalizedSectionIds };
  }
  if (normalizedGenders.length) {
    studentQuery.gender = { $in: normalizedGenders };
  }

  const students = await Student.find(studentQuery).select("_id");

  if (!students.length) {
    return next(new AppError("No students found for the provided filters", 404));
  }

  const resolvedAmount =
    amountDue !== undefined && amountDue !== null && amountDue !== ""
      ? Number(amountDue)
      : feeType.defaultAmount;

  if (resolvedAmount === undefined || resolvedAmount === null || Number.isNaN(Number(resolvedAmount)) || resolvedAmount < 0) {
    return next(
      new AppError("Provide a non-negative amount due or configure a default amount on the fee type", 400)
    );
  }

  const amountNumber = Number(resolvedAmount);
  const dueDateValue = dueDate ? new Date(dueDate) : undefined;
  const studentIdsForQuery = students.map((student) => student._id);

  const existingFees = await StudentFee.find({
    student: { $in: studentIdsForQuery },
    feeType: feeTypeId,
    academicYear,
    ...(term ? { term } : {}),
  }).select("student");

  const existingSet = new Set(existingFees.map((fee) => fee.student.toString()));

  const documents = [];
  let skipped = 0;

  students.forEach((student) => {
    if (existingSet.has(student._id.toString())) {
      skipped += 1;
      return;
    }

    documents.push({
      student: student._id,
      feeType: feeTypeId,
      academicYear,
      term,
      amountDue: amountNumber,
      paidAmount: 0,
      status: amountNumber === 0 ? "paid" : "pending",
      dueDate: dueDateValue,
      notes,
    });
  });

  if (!documents.length) {
    return res.status(200).json({
      success: true,
      data: {
        created: 0,
        skipped,
      },
      message: "No new student fees were created.",
    });
  }

  await StudentFee.insertMany(documents);

  res.status(201).json({
    success: true,
    data: {
      created: documents.length,
      skipped,
    },
    message: "Student fees created successfully",
  });
});

exports.updateStudentFee = catchAsync(async (req, res, next) => {
  const disallowedFields = ["paidAmount", "payments", "lastPaymentAt", "transaction"];
  disallowedFields.forEach((field) => delete req.body[field]);

  const studentFee = await StudentFee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!studentFee) {
    return next(new AppError("Student fee record not found", 404));
  }

  res.status(200).json({
    success: true,
    data: studentFee,
  });
});

exports.deleteStudentFee = catchAsync(async (req, res, next) => {
  const studentFee = await StudentFee.findById(req.params.id);

  if (!studentFee) {
    return next(new AppError("Student fee record not found", 404));
  }

  if (studentFee.payments && studentFee.payments.length > 0) {
    return next(new AppError("Cannot delete student fee that has payments. Consider cancelling instead.", 400));
  }

  await studentFee.deleteOne();

  res.status(200).json({
    success: true,
    message: "Student fee record deleted successfully",
  });
});

exports.recordStudentFeePayment = catchAsync(async (req, res, next) => {
  const { amount, paymentDate, paymentMethod, referenceNumber, notes } = req.body;

  if (typeof amount !== "number" || amount <= 0) {
    return next(new AppError("Payment amount must be greater than zero", 400));
  }

  const studentFee = await StudentFee.findById(req.params.id);

  if (!studentFee) {
    return next(new AppError("Student fee record not found", 404));
  }

  if (studentFee.status === "cancelled") {
    return next(new AppError("Cannot add payment to a cancelled fee record", 400));
  }

  if (studentFee.status === "paid") {
    return next(new AppError("This fee has already been fully paid", 400));
  }

  const remaining = studentFee.amountDue - studentFee.paidAmount;
  if (amount > remaining) {
    return next(
      new AppError(`Payment exceeds remaining amount. Remaining balance is ${remaining}`, 400)
    );
  }

  const paymentDateValue = paymentDate ? new Date(paymentDate) : new Date();

  const transaction = await AccountTransaction.create({
    transactionType: "FEE_PAYMENT",
    direction: "credit",
    amount,
    transactionDate: paymentDateValue,
    paymentMethod,
    referenceNumber,
    narration: `Fee payment for student ${studentFee.student}`,
    studentFee: studentFee._id,
    createdBy: req.user ? req.user.id : undefined,
  });

  studentFee.paidAmount += amount;
  const statusAfterPayment =
    studentFee.paidAmount === studentFee.amountDue ? "paid" : "partially_paid";
  studentFee.status = statusAfterPayment;
  studentFee.lastPaymentAt = paymentDateValue;
  studentFee.payments.push({
    amount,
    paymentDate: paymentDateValue,
    paymentMethod,
    referenceNumber,
    notes,
    transaction: transaction._id,
  });

  await studentFee.save();

  res.status(201).json({
    success: true,
    data: studentFee,
  });
});

exports.cancelStudentFee = catchAsync(async (req, res, next) => {
  const studentFee = await StudentFee.findById(req.params.id);

  if (!studentFee) {
    return next(new AppError("Student fee record not found", 404));
  }

  if (studentFee.status === "paid") {
    return next(new AppError("Cannot cancel a fee that is already paid", 400));
  }

  studentFee.status = "cancelled";
  await studentFee.save();

  res.status(200).json({
    success: true,
    data: studentFee,
  });
});

