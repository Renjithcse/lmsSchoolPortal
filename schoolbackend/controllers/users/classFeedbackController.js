const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');

const Settings = require('../../models/Admin/Settings');
const ClassTeacher = require('../../models/Admin/ClassTeacher');
const AcademicStudent = require('../../models/users/AcademicStudent');
const ClassFeedback = require('../../models/Feedback/ClassFeedback');

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

// Teacher: list classes where the logged-in teacher is class teacher
exports.getMyClassTeacherClasses = catchAsync(async (req, res, next) => {
	const teacherId = req.teacherId;
	if (!teacherId && req.user?.role !== 'admin') return next(new AppError('Teacher ID not found in token', 401));

	const academicYear = await getCurrentAcademicYearId();
	if (!academicYear) return next(new AppError('No current academic year found in settings', 404));

	const classes = await ClassTeacher.find({ teacher: teacherId, academicYear })
		.populate('grade', 'gradeName')
		.populate('section', 'sectionName')
		.sort({ createdAt: -1 })
		.lean();

	const formatted = classes.map((c) => ({
		_id: c._id,
		academicYear: c.academicYear,
		grade: c.grade,
		gender: c.gender,
		section: c.section,
		label: `${c.grade?.gradeName || 'Grade'} - ${String(c.gender).toUpperCase()} - ${c.section?.sectionName || 'Section'}`,
	}));

	res.status(200).json({
		status: 'success',
		results: formatted.length,
		data: formatted,
	});
});

// Teacher/Admin: get students for a selected class-teacher assignment or grade/gender/section
exports.getStudentsForMyClassTeacherClass = catchAsync(async (req, res, next) => {
	const isAdmin = req.tokenUser?.role === 'admin';
	const teacherId = req.teacherId;

	if (!isAdmin && !teacherId) {
		return next(new AppError('Teacher ID not found in token', 401));
	}

	const { classTeacherId, grade, gender, section } = req.query;
	const academicYear = await getCurrentAcademicYearId();
	if (!academicYear) return next(new AppError('No current academic year found in settings', 404));

	let gradeId, genderVal, sectionId;

	if (isAdmin) {
		// Admin: use grade, gender, section directly
		if (!grade || !gender || !section) {
			return next(new AppError('grade, gender and section are required for admin', 400));
		}
		gradeId = grade;
		genderVal = gender;
		sectionId = section;
	} else {
		// Teacher: use classTeacherId
		if (!classTeacherId) {
			return next(new AppError('classTeacherId is required for teacher', 400));
		}
		const assignment = await ClassTeacher.findOne({ _id: classTeacherId, teacher: teacherId }).lean();
		if (!assignment) return next(new AppError('Class teacher assignment not found', 404));
		gradeId = assignment.grade;
		genderVal = assignment.gender;
		sectionId = assignment.section;
	}

	const students = await AcademicStudent.find({
		academicYear,
		grade: gradeId,
		gender: genderVal,
		section: sectionId,
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

// Teacher/Admin: create class feedback for a student in that class
exports.createClassFeedback = catchAsync(async (req, res, next) => {
	const isAdmin = req.user?.role === 'admin';
	console.log({user: req.user});
	const teacherId = req.teacherId;

	if (!isAdmin && !teacherId) {
		return next(new AppError('Teacher ID not found in token', 401));
	}

	const { classTeacherId, grade, gender, section, academicStudentId, feedback, feedbackDate, type } = req.body;
	
	if (!academicStudentId || !feedback) {
		return next(new AppError('academicStudentId and feedback are required', 400));
	}

	const normalizedType = normalizeType(type);
	const academicYear = await getCurrentAcademicYearId();
	if (!academicYear) return next(new AppError('No current academic year found in settings', 404));

	let gradeId, genderVal, sectionId;

	if (isAdmin) {
		// Admin: use grade, gender, section directly
		if (!grade || !gender || !section) {
			return next(new AppError('grade, gender and section are required for admin', 400));
		}
		gradeId = grade;
		genderVal = gender;
		sectionId = section;
	} else {
		// Teacher: use classTeacherId
		if (!classTeacherId) {
			return next(new AppError('classTeacherId is required for teacher', 400));
		}
		const assignment = await ClassTeacher.findOne({ _id: classTeacherId, teacher: teacherId }).lean();
		if (!assignment) return next(new AppError('Class teacher assignment not found', 404));
		gradeId = assignment.grade;
		genderVal = assignment.gender;
		sectionId = assignment.section;
	}

	const academicStudent = await AcademicStudent.findOne({
		_id: academicStudentId,
		academicYear,
		grade: gradeId,
		gender: genderVal,
		section: sectionId,
		status: 'active',
	}).lean();

	if (!academicStudent) return next(new AppError('Student not found for this class', 404));

	const created = await ClassFeedback.create({
		academicYear,
		grade: gradeId,
		gender: genderVal,
		section: sectionId,
		academicStudentId: academicStudent._id,
		studentId: academicStudent.studentId,
		type: normalizedType,
		feedbackDate: feedbackDate ? new Date(feedbackDate) : new Date(),
		feedback: String(feedback).trim(),
		createdBy: req.user._id,
		updatedBy: req.user._id,
	});

	res.status(201).json({
		status: 'success',
		data: {
			classFeedback: created,
		},
	});
});

// Student: list my class feedback (current academic year)
exports.getMyClassFeedback = catchAsync(async (req, res, next) => {
	const studentId = req.studentId;
	if (!studentId) return next(new AppError('Student ID not found in token', 401));

	const academicYear = await getCurrentAcademicYearId();
	if (!academicYear) return next(new AppError('No current academic year found in settings', 404));

	const type = normalizeType(req.query.type);

	const feedbacks = await ClassFeedback.find({ studentId, academicYear, type: buildTypeMatch(type) })
		.populate('createdBy', 'name email')
		.populate('studentId', 'studentName studentID _id')
		.sort({ createdAt: -1 })
		.lean();

	res.status(200).json({
		status: 'success',
		results: feedbacks.length,
		data: feedbacks,
	});
});

// Teacher/Admin: list class feedback for a selected class-teacher assignment or grade/gender/section
exports.getMyClassFeedbackForClass = catchAsync(async (req, res, next) => {
	const isAdmin = req.user?.role === 'admin';
	const teacherId = req.teacherId;

	if (!isAdmin && !teacherId) {
		return next(new AppError('Teacher ID not found in token', 401));
	}

	const { classTeacherId, grade, gender, section } = req.query;
	const academicYear = await getCurrentAcademicYearId();
	if (!academicYear) return next(new AppError('No current academic year found in settings', 404));

	const type = normalizeType(req.query.type);

	let gradeId, genderVal, sectionId;

	if (isAdmin) {
		// Admin: use grade, gender, section directly
		if (!grade || !gender || !section) {
			return next(new AppError('grade, gender and section are required for admin', 400));
		}
		gradeId = grade;
		genderVal = gender;
		sectionId = section;
	} else {
		// Teacher: use classTeacherId
		if (!classTeacherId) {
			return next(new AppError('classTeacherId is required for teacher', 400));
		}
		const assignment = await ClassTeacher.findOne({ _id: classTeacherId, teacher: teacherId }).lean();
		if (!assignment) return next(new AppError('Class teacher assignment not found', 404));
		gradeId = assignment.grade;
		genderVal = assignment.gender;
		sectionId = assignment.section;
	}

	const query = {
		academicYear,
		grade: gradeId,
		gender: genderVal,
		section: sectionId,
		type: buildTypeMatch(type),
	};

	

	const feedbacks = await ClassFeedback.find(query)
		.populate('studentId', 'studentName studentID _id')
		.populate('createdBy', 'name email')
		.sort({ createdAt: -1 })
		.lean();

	res.status(200).json({
		status: 'success',
		results: feedbacks.length,
		data: feedbacks,
	});
});

// Teacher: update a feedback created by the teacher
exports.updateMyClassFeedback = catchAsync(async (req, res, next) => {
	const teacherId = req.teacherId;
	if (!teacherId) return next(new AppError('Teacher ID not found in token', 401));

	const { id } = req.params;
	const { feedback, feedbackDate, type } = req.body;

	if (!feedback) return next(new AppError('feedback is required', 400));

	const normalizedType = type ? normalizeType(type) : undefined;

	const updated = await ClassFeedback.findOneAndUpdate(
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
	).populate('studentId', 'studentName studentID _id');

	if (!updated) return next(new AppError('Feedback not found', 404));

	res.status(200).json({
		status: 'success',
		data: {
			classFeedback: updated,
		},
	});
});

// Teacher: delete a feedback created by the teacher
exports.deleteMyClassFeedback = catchAsync(async (req, res, next) => {
	const teacherId = req.teacherId;
	if (!teacherId) return next(new AppError('Teacher ID not found in token', 401));

	const { id } = req.params;

	const deleted = await ClassFeedback.findOneAndDelete({ _id: id, createdBy: req.user._id });
	if (!deleted) return next(new AppError('Feedback not found', 404));

	res.status(200).json({
		status: 'success',
		data: null,
	});
});

