const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');

const Settings = require('../../models/Admin/Settings');
const SubjectPermissions = require('../../models/Admin/SubjectPermissions');
const GradeSubject = require('../../models/Admin/GradeSubject');
const AcademicStudent = require('../../models/users/AcademicStudent');
const SubjectFeedback = require('../../models/Feedback/SubjectFeedback');

const getCurrentAcademicYearId = async () => {
  const settings = await Settings.findOne();
  if (!settings?.academicYear) return null;
  return settings.academicYear;
};

const normalizeType = (type) => {
  const t = String(type || 'feedback').toLowerCase();
  if (!['feedback', 'discipline'].includes(t)) return 'feedback';
  return t;
};

const buildTypeMatch = (type) => {
  // Backward compatible: old docs may have no `type` (treat as 'feedback')
  if (type === 'feedback') return { $in: ['feedback', null] };
  return type;
};

const teacherHasClassAccess = async ({ academicYear, teacherId, grade, gender, section }) => {
  const hasSubjectPermission = await SubjectPermissions.exists({
    academicYear,
    teacher: teacherId,
    grade,
    gender,
    section,
  });
  if (hasSubjectPermission) return true;

  const hasGradeSubject = await GradeSubject.exists({
    academicYear,
    teacher: teacherId,
    grade,
    gender,
    section,
    Status: 'active',
  });
  return !!hasGradeSubject;
};

const teacherCanTeachSubject = async ({ academicYear, teacherId, grade, gender, section, subject }) => {
  const hasSubjectPermission = await SubjectPermissions.exists({
    academicYear,
    teacher: teacherId,
    grade,
    gender,
    section,
    subjects: subject,
  });
  if (hasSubjectPermission) return true;

  const hasGradeSubject = await GradeSubject.exists({
    academicYear,
    teacher: teacherId,
    grade,
    gender,
    section,
    subject,
    Status: 'active',
  });
  return !!hasGradeSubject;
};

// Teacher: list students for selected grade/gender/section (only if teacher has access)
exports.getStudentsForSubjectFeedback = catchAsync(async (req, res, next) => {
  const teacherId = req.teacherId;
  const isAdmin = req.user?.role === 'admin';
  if (!teacherId && !isAdmin) return next(new AppError('Teacher ID not found in token', 401));

  const { grade, gender, section } = req.query;
  if (!grade || !gender || !section) {
    return next(new AppError('grade, gender and section are required', 400));
  }

  const academicYear = await getCurrentAcademicYearId();
  if (!academicYear) return next(new AppError('No current academic year found in settings', 404));

  const allowed = isAdmin ? true : await teacherHasClassAccess({ academicYear, teacherId, grade, gender, section });
  if (!allowed) return next(new AppError('You do not have permission for this class', 403));

  const students = await AcademicStudent.find({
    academicYear,
    grade,
    gender,
    section,
    status: 'active',
  })
    .populate('studentId', 'studentName studentID image _id')
    .select('studentId _id')
    .sort({ 'studentId.studentName': 1 })
    .lean();

  const formatted = students
    .filter((s) => s.studentId)
    .map((s) => ({
      academicStudentId: s._id,
      studentId: s.studentId._id,
      studentName: s.studentId.studentName,
      studentID: s.studentId.studentID,
      image: s.studentId.image,
    }));

  res.status(200).json({
    status: 'success',
    results: formatted.length,
    data: formatted,
  });
});

// Teacher: create subject feedback
exports.createSubjectFeedback = catchAsync(async (req, res, next) => {
  const isAdmin = req.user?.role === 'admin';
  const teacherId = req.teacherId;
  if (!isAdmin && !teacherId) return next(new AppError('Teacher ID not found in token', 401));

  const { grade, gender, section, subject, academicStudentId, feedback, feedbackDate, type } = req.body;
  if (!grade || !gender || !section || !subject || !academicStudentId || !feedback) {
    return next(new AppError('grade, gender, section, subject, academicStudentId and feedback are required', 400));
  }

  const normalizedType = normalizeType(type);

  const academicYear = await getCurrentAcademicYearId();
  if (!academicYear) return next(new AppError('No current academic year found in settings', 404));

  const canTeach = isAdmin ? true : await teacherCanTeachSubject({ academicYear, teacherId, grade, gender, section, subject });
  if (!canTeach) return next(new AppError('You do not have permission for this subject/class', 403));

  const academicStudent = await AcademicStudent.findOne({
    _id: academicStudentId,
    academicYear,
    grade,
    gender,
    section,
    status: 'active',
  }).lean();
  if (!academicStudent) return next(new AppError('Student not found for this class', 404));

  const created = await SubjectFeedback.create({
    academicYear,
    academicStudentId: academicStudent._id,
    studentId: academicStudent.studentId,
    createdBy: req.user._id,
    updatedBy: req.user._id,
    grade,
    gender,
    section,
    subject,
    type: normalizedType,
    feedback: String(feedback).trim(),
    feedbackDate: feedbackDate ? new Date(feedbackDate) : new Date(),
  });

  res.status(201).json({
    status: 'success',
    data: {
      subjectFeedback: created,
    },
  });
});

// Teacher: list subject feedback for selected filters
exports.getMySubjectFeedbackList = catchAsync(async (req, res, next) => {
  const isAdmin = req.user?.role === 'admin';
  const teacherId = req.teacherId;
  if (!isAdmin && !teacherId) return next(new AppError('Teacher ID not found in token', 401));

  const { grade, gender, section, subject } = req.query;
  if (!grade || !gender || !section || !subject) {
    return next(new AppError('grade, gender, section and subject are required', 400));
  }

  const academicYear = await getCurrentAcademicYearId();
  if (!academicYear) return next(new AppError('No current academic year found in settings', 404));

  const canTeach = isAdmin ? true : await teacherCanTeachSubject({ academicYear, teacherId, grade, gender, section, subject });
  if (!canTeach) return next(new AppError('You do not have permission for this subject/class', 403));

  const type = normalizeType(req.query.type);

  const feedbacks = await SubjectFeedback.find({
    academicYear,
    grade,
    gender,
    section,
    subject,
    type: buildTypeMatch(type),
  })
    .populate('studentId', 'studentName studentID _id')
    .populate('subject', 'subjectName')
    .sort({ feedbackDate: -1, createdAt: -1 })
    .lean();

  res.status(200).json({
    status: 'success',
    results: feedbacks.length,
    data: feedbacks,
  });
});

// Teacher: update a subject feedback created by the teacher
exports.updateMySubjectFeedback = catchAsync(async (req, res, next) => {
  const teacherId = req.teacherId;
  if (!teacherId) return next(new AppError('Teacher ID not found in token', 401));

  const { id } = req.params;
  const { feedback, feedbackDate, type } = req.body;
  if (!feedback) return next(new AppError('feedback is required', 400));

  const normalizedType = type ? normalizeType(type) : undefined;

  const updated = await SubjectFeedback.findOneAndUpdate(
    { _id: id, createdBy: req.user._id },
    {
      $set: {
        feedback: String(feedback).trim(),
        ...(feedbackDate ? { feedbackDate: new Date(feedbackDate) } : {}),
        ...(normalizedType ? { type: normalizedType } : {}),
        updatedBy: req.user._id,
      },
    },
    { new: true, runValidators: true }
  )
    .populate('studentId', 'studentName studentID _id')
    .populate('subject', 'subjectName');

  if (!updated) return next(new AppError('Feedback not found', 404));

  res.status(200).json({
    status: 'success',
    data: {
      subjectFeedback: updated,
    },
  });
});

// Teacher: delete a subject feedback created by the teacher
exports.deleteMySubjectFeedback = catchAsync(async (req, res, next) => {
  const teacherId = req.teacherId;
  if (!teacherId) return next(new AppError('Teacher ID not found in token', 401));

  const { id } = req.params;
  const deleted = await SubjectFeedback.findOneAndDelete({ _id: id, createdBy: req.user._id });
  if (!deleted) return next(new AppError('Feedback not found', 404));

  res.status(200).json({
    status: 'success',
    data: null,
  });
});

// Student: list my subject feedback (current academic year)
exports.getMySubjectFeedback = catchAsync(async (req, res, next) => {
  const studentId = req.studentId;
  if (!studentId) return next(new AppError('Student ID not found in token', 401));

  const academicYear = await getCurrentAcademicYearId();
  if (!academicYear) return next(new AppError('No current academic year found in settings', 404));

  const type = normalizeType(req.query.type);

  const feedbacks = await SubjectFeedback.find({ studentId, academicYear, type: buildTypeMatch(type) })
    .populate('createdBy', 'name email')
    .populate('subject', 'subjectName')
    .sort({ feedbackDate: -1, createdAt: -1 })
    .lean();

  res.status(200).json({
    status: 'success',
    results: feedbacks.length,
    data: feedbacks,
  });
});

