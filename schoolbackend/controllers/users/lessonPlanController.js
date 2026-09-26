const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const LessonPlan = require('../../models/LessonPlans/LessonPlan');
const LessonPlanProgress = require('../../models/LessonPlans/LessonPlanProgress');
const PublishedChapter = require('../../models/LessonPlans/PublishedChapter');
const Chapter = require('../../models/LessonPlans/Chapter');
const Student = require('../../models/users/Student');
const AcademicStudent = require('../../models/users/AcademicStudent');
const GradeSubject = require('../../models/Admin/GradeSubject');
const Settings = require('../../models/Admin/Settings');

const resolveStudentContext = async (req) => {
  let studentId = req.studentId;

  if (!studentId && req.user && req.user.role === 'student') {
    const studentRecord = await Student.findOne({ userId: req.user._id });
    if (studentRecord) {
      studentId = studentRecord._id;
    }
  }

  if (!studentId) {
    throw new AppError('Student context not found', 401);
  }

  const currentSettings = await Settings.findOne().populate('academicYear');
  if (!currentSettings?.academicYear) {
    throw new AppError('System settings not configured', 500);
  }

  const academicDetails = await AcademicStudent.findOne({
    studentId,
    status: 'active',
  }).populate('academicYear grade section studentId');

  if (!academicDetails) {
    throw new AppError('Student academic information not found', 404);
  }

  if (!academicDetails.grade || !academicDetails.section) {
    throw new AppError('Student grade or section information is incomplete', 400);
  }

  const normalizedGender = academicDetails.gender ? String(academicDetails.gender).toLowerCase() : 'male';
  const genderVariants = Array.from(
    new Set([
      normalizedGender,
      normalizedGender.toUpperCase(),
      normalizedGender.charAt(0).toUpperCase() + normalizedGender.slice(1),
      'all',
      'both',
      'coed',
      'co-ed',
      'mixed',
    ])
  );

  const context = {
    studentId,
    academicYearId: currentSettings.academicYear._id,
    gradeId: academicDetails.grade._id,
    sectionId: academicDetails.section._id,
    gender: normalizedGender,
    genderVariants,
    studentName: academicDetails.studentId?.studentName || academicDetails.studentId?.name || 'Unknown',
    gradeName: academicDetails.grade?.gradeName || 'Unknown',
    sectionName: academicDetails.section?.sectionName || 'Unknown',
    academicYearName: currentSettings.academicYear?.academicYear || 'Unknown',
  };

  return context;
};

exports.getStudentLessonPlanSubjects = catchAsync(async (req, res, next) => {
  const context = await resolveStudentContext(req);

  // Get grade subjects to determine which subjects the student has access to
  const gradeSubjects = await GradeSubject.find({
    academicYear: context.academicYearId,
    grade: context.gradeId,
    gender: { $in: context.genderVariants },
    section: context.sectionId,
    Status: 'active',
  })
    .populate('subject', 'subjectName')
    .populate('teacher', 'employeeName employeeId');

  const subjectIds = gradeSubjects.map((gs) => gs.subject?._id).filter(Boolean);

  if (!subjectIds.length) {
    return next(new AppError('Subjects not configured for your class', 404));
  }

  // Find published chapters for the student's class and subjects
  const publishedChapters = await PublishedChapter.findForStudent(
    context.academicYearId,
    context.gradeId,
    context.gender,
    context.sectionId,
    subjectIds
  );

  // Get chapter IDs from published chapters
  const chapterIds = publishedChapters.map((pc) => pc.chapter?._id).filter(Boolean);

  if (!chapterIds.length) {
    // Return subjects with zero stats if no published chapters
    const subjects = gradeSubjects.map((gradeSubject) => ({
      gradeSubjectId: gradeSubject._id,
      subject: gradeSubject.subject,
      teacher: gradeSubject.teacher,
      stats: {
        planned: 0,
        inProgress: 0,
        completed: 0,
        total: 0,
        averageProgress: 0,
        latestUpdate: null,
      },
    }));

    return res.status(200).json({
      status: 'success',
      data: {
        student: {
          name: context.studentName,
          grade: context.gradeName,
          section: context.sectionName,
          academicYear: context.academicYearName,
        },
        subjects,
      },
    });
  }

  // Get lesson plans for published chapters
  const lessonPlans = await LessonPlan.find({
    chapter: { $in: chapterIds },
    isArchived: { $ne: true },
  })
    .populate({
      path: 'chapter',
      select: 'chapterName description subject',
      populate: [
        { path: 'subject', select: 'subjectName' },
      ],
    })
    .populate('chapter')
    .populate('createdByTeacher', 'employeeName employeeId')
    .sort({ order: 1, startDate: 1, createdAt: -1 });

  const progressRecords = await LessonPlanProgress.find({
    lessonPlan: { $in: lessonPlans.map((plan) => plan._id) },
    publishedChapter: { $in: publishedChapters.map((pc) => pc._id) },
  }).lean();

  const progressMap = progressRecords.reduce((acc, record) => {
    if (record.lessonPlan) {
      acc.set(record.lessonPlan.toString(), record);
    }
    return acc;
  }, new Map());

  const subjectStats = new Map();

  lessonPlans.forEach((plan) => {
    const subjectId = plan.chapter?.subject?._id?.toString();
    if (!subjectId) return;
    const entry = progressMap.get(plan._id.toString());
    const progress = entry?.progress ?? plan.progress ?? 0;
    const status = entry?.status ?? plan.status ?? 'planned';
    const latestUpdate = entry?.updatedAt || plan.updatedAt || plan.createdAt;

    if (!subjectStats.has(subjectId)) {
      subjectStats.set(subjectId, {
        planned: 0,
        inProgress: 0,
        completed: 0,
        total: 0,
        progressSum: 0,
        latestUpdate: null,
      });
    }

    const stats = subjectStats.get(subjectId);
    stats.total += 1;
    stats.progressSum += progress;
    if (status === 'completed') stats.completed += 1;
    else if (status === 'in-progress') stats.inProgress += 1;
    else stats.planned += 1;
    if (latestUpdate && (!stats.latestUpdate || latestUpdate > stats.latestUpdate)) {
      stats.latestUpdate = latestUpdate;
    }
  });

  const subjects = gradeSubjects.map((gradeSubject) => {
    const subjectId = gradeSubject.subject?._id?.toString();
    const stats = subjectId && subjectStats.has(subjectId) ? subjectStats.get(subjectId) : null;
    const averageProgress =
      stats && stats.total > 0 ? Number((stats.progressSum / stats.total).toFixed(1)) : 0;
    return {
      gradeSubjectId: gradeSubject._id,
      subject: gradeSubject.subject,
      teacher: gradeSubject.teacher,
      stats: {
        planned: stats?.planned || 0,
        inProgress: stats?.inProgress || 0,
        completed: stats?.completed || 0,
        total: stats?.total || 0,
        averageProgress,
        latestUpdate: stats?.latestUpdate || null,
      },
    };
  });

  res.status(200).json({
    status: 'success',
    data: {
      student: {
        name: context.studentName,
        grade: context.gradeName,
        section: context.sectionName,
        academicYear: context.academicYearName,
      },
      subjects,
    },
  });
});

exports.getStudentLessonPlansBySubject = catchAsync(async (req, res, next) => {
  const { subjectId } = req.params;
  const context = await resolveStudentContext(req);

  const gradeSubject = await GradeSubject.findOne({
    academicYear: context.academicYearId,
    grade: context.gradeId,
    gender: { $in: context.genderVariants },
    section: context.sectionId,
    subject: subjectId,
    Status: 'active',
  })
    .populate('subject', 'subjectName')
    .populate('teacher', 'employeeName employeeId');

  if (!gradeSubject) {
    return next(new AppError('You do not have access to this subject', 403));
  }

  // Find published chapters for this subject
  const publishedChapters = await PublishedChapter.findForClass(
    context.academicYearId,
    context.gradeId,
    context.gender,
    context.sectionId,
    subjectId,
    'active'
  );

  // Get chapter IDs from published chapters
  const chapterIds = publishedChapters.map((pc) => pc.chapter?._id).filter(Boolean);

  if (!chapterIds.length) {
    // Return empty plans if no published chapters
    return res.status(200).json({
      status: 'success',
      data: {
        subject: gradeSubject.subject,
        teacher: gradeSubject.teacher,
        plans: [],
        summary: {
          total: 0,
          completed: 0,
          inProgress: 0,
          planned: 0,
          averageProgress: 0,
        },
      },
    });
  }

  // Get lesson plans from published chapters
  const lessonPlans = await LessonPlan.find({
    chapter: { $in: chapterIds },
    isArchived: { $ne: true },
  })
    .populate({
      path: 'chapter',
      select: 'chapterName description',
      populate: [
        { path: 'grade', select: 'gradeName' },
        { path: 'subject', select: 'subjectName' }
      ]
    })
    .populate('createdByTeacher', 'employeeName employeeId')
    .sort({ order: 1, startDate: 1, createdAt: -1 });

  const progressRecords = await LessonPlanProgress.find({
    lessonPlan: { $in: lessonPlans.map((plan) => plan._id) },
    publishedChapter: { $in: publishedChapters.map((pc) => pc._id) },
  }).lean();

  const progressMap = progressRecords.reduce((acc, record) => {
    if (record.lessonPlan) {
      acc.set(record.lessonPlan.toString(), record);
    }
    return acc;
  }, new Map());

  const plansWithProgress = lessonPlans.map((plan) => {
    const planCopy = plan.toObject ? plan.toObject() : { ...plan };
    const entry = progressMap.get(plan._id.toString());
    planCopy.progress = entry?.progress ?? planCopy.progress ?? 0;
    planCopy.status = entry?.status ?? planCopy.status;
    planCopy.progressNotes = entry?.notes || '';
    return planCopy;
  });

  const summary = plansWithProgress.reduce(
    (acc, plan) => {
      const status = plan.status || 'planned';
      if (status === 'completed') acc.completed += 1;
      else if (status === 'in-progress') acc.inProgress += 1;
      else acc.planned += 1;
      acc.total += 1;
      acc.progressSum += plan.progress || 0;
      return acc;
    },
    { total: 0, completed: 0, inProgress: 0, planned: 0, progressSum: 0 }
  );

  res.status(200).json({
    status: 'success',
    data: {
      subject: gradeSubject.subject,
      teacher: gradeSubject.teacher,
      plans: plansWithProgress,
      summary: {
        total: summary.total,
        completed: summary.completed,
        inProgress: summary.inProgress,
        planned: summary.planned,
        averageProgress:
          summary.total > 0 ? Number((summary.progressSum / summary.total).toFixed(1)) : 0,
      },
    },
  });
});

exports.getStudentLessonPlan = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const context = await resolveStudentContext(req);

  // Find the lesson plan
  const lessonPlan = await LessonPlan.findById(id)
    .populate({
      path: 'chapter',
      select: 'chapterName description grade subject',
      populate: [
        { path: 'grade', select: 'gradeName' },
        { path: 'subject', select: 'subjectName' }
      ]
    })
    .populate('createdByTeacher', 'employeeName employeeId')
    .populate('updatedByTeacher', 'employeeName employeeId');

  if (!lessonPlan || !lessonPlan.chapter) {
    return next(new AppError('Lesson plan not found', 404));
  }

  // Verify the chapter is published to the student's class
  const publishedChapter = await PublishedChapter.findOne({
    chapter: lessonPlan.chapter._id,
    academicYear: context.academicYearId,
    grade: context.gradeId,
    gender: context.gender,
    section: context.sectionId,
    subject: lessonPlan.chapter.subject?._id,
    status: 'active',
  });

  if (!publishedChapter) {
    return next(new AppError('You do not have access to this lesson plan', 403));
  }

  if (lessonPlan.isArchived) {
    return next(new AppError('Lesson plan not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: lessonPlan,
  });
});

