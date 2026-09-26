const mongoose = require('mongoose');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const LessonPlan = require('../../models/LessonPlans/LessonPlan');
const Chapter = require('../../models/LessonPlans/Chapter');
const GradeSubject = require('../../models/Admin/GradeSubject');
const Settings = require('../../models/Admin/Settings');
const PublishedChapter = require('../../models/LessonPlans/PublishedChapter');
const LessonPlanProgress = require('../../models/LessonPlans/LessonPlanProgress');
const GradePermission = require('../../models/Admin/GradePermissions');
const SubjectPermission = require('../../models/Admin/SubjectPermissions');

// Get available subjects for chapters based on grade (used for creating chapters)
exports.getAvailableSubjects = catchAsync(async (req, res, next) => {
	let { academicYear } = req.query;
	const { grade } = req.query;

	if (!grade) {
		return next(new AppError('Please provide grade', 400));
	}

	if (!academicYear) {
		const currentSettings = await Settings.findOne();
		if (!currentSettings?.academicYear) {
			return next(new AppError('Current academic year is not configured', 404));
		}
		academicYear = currentSettings.academicYear;
	}

	// Get unique subjects for this grade (across all genders and sections)
	const gradeSubjects = await GradeSubject.find({
		academicYear,
		grade,
		Status: 'active',
	}).distinct('subject');

	if (gradeSubjects.length === 0) {
		return next(new AppError('No subjects found for the selected grade', 404));
	}

	// Get subject details
	const Subject = require('../../models/Admin/Subject');
	const subjects = await Subject.find({ _id: { $in: gradeSubjects } })
		.select('_id subjectName')
		.lean();

	res.status(200).json({
		status: 'success',
		data: {
			subjects: subjects.map((sub) => ({
				subjectId: sub._id,
				subjectName: sub.subjectName,
			})),
		},
	});
});

exports.createLessonPlan = catchAsync(async (req, res, next) => {
	const {
		chapter,
		order,
		topic,
		subTopics,
		objectives,
		activities,
		resources,
		assessment,
		notes,
		status,
		progress,
		startDate,
		endDate,
		tags,
	} = req.body;

	if (!chapter || !topic) {
		return next(new AppError('Please provide chapter and topic', 400));
	}

	// Verify chapter exists
	const chapterDoc = await Chapter.findById(chapter);
	if (!chapterDoc) {
		return next(new AppError('Chapter not found', 404));
	}

	// Get teacher ID if available
	const Teacher = require('../../models/users/Teacher');
	let teacherId = req.teacherId;
	if (!teacherId && req.user && req.user.role === 'user') {
		const teacher = await Teacher.findOne({ userId: req.user._id });
		if (teacher) {
			teacherId = teacher._id;
		}
	}

	// Get the highest order for this chapter to set default order
	let lessonOrder = order;
	if (lessonOrder === undefined || lessonOrder === null) {
		const maxOrder = await LessonPlan.findOne({ chapter })
			.sort({ order: -1 })
			.select('order')
			.lean();
		lessonOrder = maxOrder ? (maxOrder.order + 1) : 0;
	}

	const lessonPlan = await LessonPlan.create({
		chapter,
		order: lessonOrder,
		topic,
		subTopics: Array.isArray(subTopics) ? subTopics : subTopics?.split(',').map((item) => item.trim()).filter(Boolean),
		objectives,
		activities,
		resources: Array.isArray(resources) ? resources : resources?.split(',').map((item) => item.trim()).filter(Boolean),
		assessment,
		notes,
		status: status || 'planned',
		progress: progress || 0,
		startDate,
		endDate,
		tags: Array.isArray(tags) ? tags : tags?.split(',').map((item) => item.trim()).filter(Boolean),
		createdBy: req.user.id,
		createdByTeacher: teacherId,
	});

	await lessonPlan.populate([
		{ path: 'chapter', select: 'chapterName description grade subject' },
		{ path: 'chapter', populate: { path: 'grade', select: 'gradeName' } },
		{ path: 'chapter', populate: { path: 'subject', select: 'subjectName' } },
		{ path: 'createdBy', select: 'name email role' },
		{ path: 'createdByTeacher', select: 'employeeName employeeId' },
	]);

	res.status(201).json({
		status: 'success',
		data: lessonPlan,
	});
});

exports.getLessonPlans = catchAsync(async (req, res) => {
	const {
		chapter,
		status,
		search,
		startDate,
		endDate,
		page = 1,
		limit = 10,
	} = req.query;

	const query = {};

	if (chapter) {
		query.chapter = chapter;
	}

	if (status) {
		query.status = Array.isArray(status) ? { $in: status } : status;
	}

	// if (req.user?.role === 'user' && req.teacherId) {
	// 	query.createdByTeacher = req.teacherId;
	// }

	if (search) {
		query.$text = { $search: search };
	}

	if (startDate || endDate) {
		query.startDate = {};
		if (startDate) {
			query.startDate.$gte = new Date(startDate);
		}
		if (endDate) {
			query.startDate.$lte = new Date(endDate);
		}
	}

	const skip = (Number(page) - 1) * Number(limit);

	const [lessonPlans, total, groupedStats] = await Promise.all([
		LessonPlan.find(query)
			.populate({
				path: 'chapter',
				select: 'chapterName description grade subject',
				populate: [
					{ path: 'grade', select: 'gradeName' },
					{ path: 'subject', select: 'subjectName' }
				]
			})
			.populate('createdBy', 'name email role')
			.populate('createdByTeacher', 'employeeName employeeId')
			.populate('updatedBy', 'name email role')
			.populate('updatedByTeacher', 'employeeName employeeId')
			.sort({ order: 1, startDate: 1, createdAt: -1 })
			.skip(skip)
			.limit(Number(limit)),
		LessonPlan.countDocuments(query),
		LessonPlan.aggregate([
			{ $match: { ...query, isArchived: false } },
			{
				$group: {
					_id: '$status',
					count: { $sum: 1 },
				},
			},
		]),
	]);

	const statusSummary = groupedStats.reduce((acc, item) => {
		acc[item._id] = item.count;
		return acc;
	}, {});

	res.status(200).json({
		status: 'success',
		results: lessonPlans.length,
		total,
		currentPage: Number(page),
		totalPages: Math.ceil(total / Number(limit) || 1),
		summary: {
			planned: statusSummary.planned || 0,
			inProgress: statusSummary['in-progress'] || 0,
			completed: statusSummary.completed || 0,
		},
		data: lessonPlans,
	});
});

exports.getLessonPlan = catchAsync(async (req, res, next) => {
	const { id } = req.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return next(new AppError('Invalid lesson plan id', 400));
	}

	const query = { _id: id };

	// if (req.user?.role === 'user' && req.teacherId) {
	// 	query.createdByTeacher = req.teacherId;
	// }

	const lessonPlan = await LessonPlan.findOne(query)
		.populate({
			path: 'chapter',
			select: 'chapterName description grade subject academicYear',
			populate: [
				{ path: 'grade', select: 'gradeName' },
				{ path: 'subject', select: 'subjectName' },
				{ path: 'academicYear', select: 'academicYear' }
			]
		})
		.populate('createdBy', 'name email role')
		.populate('createdByTeacher', 'employeeName employeeId')
		.populate('updatedBy', 'name email role')
		.populate('updatedByTeacher', 'employeeName employeeId');

	if (!lessonPlan) {
		return next(new AppError('Lesson plan not found', 404));
	}

	res.status(200).json({
		status: 'success',
		data: lessonPlan,
	});
});

exports.updateLessonPlan = catchAsync(async (req, res, next) => {
	const { id } = req.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return next(new AppError('Invalid lesson plan id', 400));
	}

	const lessonPlan = await LessonPlan.findById(id);

	if (!lessonPlan) {
		return next(new AppError('Lesson plan not found', 404));
	}

	if (req.user?.role === 'user' && req.teacherId) {
		if (!lessonPlan.createdByTeacher || lessonPlan.createdByTeacher.toString() !== req.teacherId.toString()) {
			return next(new AppError('You are not allowed to update this lesson plan', 403));
		}
	}

	const fieldsToUpdate = [
		'chapter',
		'order',
		'topic',
		'objectives',
		'activities',
		'assessment',
		'notes',
		'status',
		'progress',
		'startDate',
		'endDate',
	];

	fieldsToUpdate.forEach((field) => {
		if (req.body[field] !== undefined) {
			lessonPlan[field] = req.body[field];
		}
	});

	// Verify chapter exists if being updated
	if (req.body.chapter) {
		const chapterDoc = await Chapter.findById(req.body.chapter);
		if (!chapterDoc) {
			return next(new AppError('Chapter not found', 404));
		}
	}

	if (req.body.subTopics !== undefined) {
		lessonPlan.subTopics = Array.isArray(req.body.subTopics)
			? req.body.subTopics
			: req.body.subTopics?.split(',').map((item) => item.trim()).filter(Boolean);
	}

	if (req.body.resources !== undefined) {
		lessonPlan.resources = Array.isArray(req.body.resources)
			? req.body.resources
			: req.body.resources?.split(',').map((item) => item.trim()).filter(Boolean);
	}

	if (req.body.tags !== undefined) {
		lessonPlan.tags = Array.isArray(req.body.tags)
			? req.body.tags
			: req.body.tags?.split(',').map((item) => item.trim()).filter(Boolean);
	}

	lessonPlan.updatedBy = req.user.id;
	lessonPlan.updatedByTeacher = req.teacherId;

	await lessonPlan.save();

	await lessonPlan.populate([
		{
			path: 'chapter',
			select: 'chapterName description grade subject academicYear',
			populate: [
				{ path: 'grade', select: 'gradeName' },
				{ path: 'subject', select: 'subjectName' },
				{ path: 'academicYear', select: 'academicYear' }
			]
		},
		{ path: 'createdBy', select: 'name email role' },
		{ path: 'createdByTeacher', select: 'employeeName employeeId' },
		{ path: 'updatedBy', select: 'name email role' },
		{ path: 'updatedByTeacher', select: 'employeeName employeeId' },
	]);

	res.status(200).json({
		status: 'success',
		data: lessonPlan,
	});
});

exports.getLessonPlanPublishedProgress = catchAsync(async (req, res, next) => {
	const { id } = req.params;


	if (!mongoose.Types.ObjectId.isValid(id)) {
		return next(new AppError('Invalid lesson plan id', 400));
	}

	const lessonPlan = await LessonPlan.findById(id).select('chapter status progress');
	if (!lessonPlan) {
		return next(new AppError('Lesson plan not found', 404));
	}

	await lessonPlan.populate({
		path: 'chapter',
		select: 'chapterName grade subject academicYear',
		populate: [
			{ path: 'grade', select: 'gradeName' },
			{ path: 'subject', select: 'subjectName' },
			{ path: 'academicYear', select: 'academicYear' },
		],
	});

	const publishedChapters = await PublishedChapter.find({
		chapter: lessonPlan.chapter,
		status: 'active',
	})
		.populate('section', 'sectionName')
		.populate('publishedBy', 'name email')
		.sort({ publishedAt: -1 });

	const publishedChapterIds = publishedChapters.map((pc) => pc._id);

	const progressRecords = await LessonPlanProgress.find({
		lessonPlan: lessonPlan._id,
		publishedChapter: { $in: publishedChapterIds },
	}).lean();

	const progressMap = progressRecords.reduce((map, record) => {
		if (record.publishedChapter) {
			map.set(record.publishedChapter.toString(), record);
		}
		return map;
	}, new Map());

	const academicYearId =
		lessonPlan.chapter.academicYear?._id || lessonPlan.chapter.academicYear;
	const gradeId = lessonPlan.chapter.grade?._id || lessonPlan.chapter.grade;
	const subjectId = lessonPlan.chapter.subject?._id || lessonPlan.chapter.subject;

	const permittedSectionsByGender = {};

	const addPermittedSection = (gender, section) => {
		if (!gender || !section) return;
		const sectionId =
			section?._id?.toString?.() || section?.toString?.();
		if (!sectionId) return;
		permittedSectionsByGender[gender] =
			permittedSectionsByGender[gender] || new Set();
		permittedSectionsByGender[gender].add(sectionId);
	};

	if (req.user?.role !== 'admin') {
		const subjectPermissions = await SubjectPermission.find({
			academicYear: academicYearId,
			grade: gradeId,
			subjects: subjectId,
			teacher: req.teacherId,
		});

		// console.log({subjectPermissions});

		subjectPermissions.forEach((permission) => {
			addPermittedSection(permission.gender, permission.section);
		});

		if (Object.keys(permittedSectionsByGender).length === 0) {
			const gradeSubjectCriteria = {
				academicYear: academicYearId,
				grade: gradeId,
				subject: subjectId,
				Status: 'active',
			};

			const teacherSpecificGradeSubjects = req.teacherId
				? await GradeSubject.find({
						...gradeSubjectCriteria,
						teacher: req.teacherId,
				  })
				: [];

				console.log({teacherSpecificGradeSubjects});

			// const genericGradeSubjects = await GradeSubject.find({
			// 	...gradeSubjectCriteria,
			// 	teacher: { $exists: false },
			// });

			teacherSpecificGradeSubjects.forEach(
				(record) => {
					addPermittedSection(record.gender, record.section);
				}
			);
		}
	}

	const filterPublishedChapters = (publishedList) => {
		if (req.user?.role === 'admin') {
			return publishedList;
		}
		return publishedList.filter((published) => {
			const sectionId =
				published.section?._id?.toString?.() || published.section?.toString();
			const allowedSections = permittedSectionsByGender[published.gender];
			return allowedSections?.has(sectionId);
		});
	};

	const publishedClasses = filterPublishedChapters(publishedChapters).map(
		(published) => {
		const entry = progressMap.get(published._id.toString());
		return {
			_id: published._id,
			gender: published.gender,
			section: published.section,
			publishedAt: published.publishedAt,
			publishedBy: published.publishedBy,
			progress: entry?.progress ?? lessonPlan.progress ?? 0,
			status: entry?.status ?? lessonPlan.status,
			notes: entry?.notes || '',
		};
		}
	);

	res.status(200).json({
		status: 'success',
		data: {
			lessonPlan: {
				id: lessonPlan._id,
				status: lessonPlan.status,
				progress: lessonPlan.progress,
			},
			publishedClasses,
		},
	});
});

exports.updateLessonPlanPublishedProgress = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const { publishedChapterId, progress, status, notes } = req.body;

	if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(publishedChapterId)) {
		return next(new AppError('Invalid IDs provided', 400));
	}

	const lessonPlan = await LessonPlan.findById(id);
	if (!lessonPlan) {
		return next(new AppError('Lesson plan not found', 404));
	}

	const publishedChapter = await PublishedChapter.findOne({
		_id: publishedChapterId,
		chapter: lessonPlan.chapter,
		status: 'active',
	});

	if (!publishedChapter) {
		return next(new AppError('Published class not found', 404));
	}

	let progressEntry = await LessonPlanProgress.findOne({
		lessonPlan: lessonPlan._id,
		publishedChapter: publishedChapter._id,
	});

	if (!progressEntry) {
		progressEntry = new LessonPlanProgress({
			lessonPlan: lessonPlan._id,
			publishedChapter: publishedChapter._id,
		});
	}

	if (progress !== undefined) {
		progressEntry.progress = progress;
	}

	if (status) {
		progressEntry.status = status;
	}

	if (notes !== undefined) {
		progressEntry.notes = notes;
	}

	progressEntry.updatedBy = req.user?.id;

	await progressEntry.save();

	await progressEntry.populate({
		path: 'publishedChapter',
		select: 'section sectionName publishedAt gender',
	});

	res.status(200).json({
		status: 'success',
		data: progressEntry,
	});
});

exports.updateLessonPlanStatus = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const { status, progress, notes } = req.body;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return next(new AppError('Invalid lesson plan id', 400));
	}

	const lessonPlan = await LessonPlan.findById(id);

	if (!lessonPlan) {
		return next(new AppError('Lesson plan not found', 404));
	}

	if (req.user?.role === 'user' && req.teacherId) {
		if (!lessonPlan.createdByTeacher || lessonPlan.createdByTeacher.toString() !== req.teacherId.toString()) {
			return next(new AppError('You are not allowed to update this lesson plan', 403));
		}
	}

	if (status) {
		lessonPlan.status = status;
	}

	if (progress !== undefined) {
		lessonPlan.progress = progress;
	}

	if (notes !== undefined) {
		lessonPlan.notes = notes;
	}

	lessonPlan.updatedBy = req.user.id;
	lessonPlan.updatedByTeacher = req.teacherId;

	await lessonPlan.save();

	await lessonPlan.populate([
		{
			path: 'chapter',
			select: 'chapterName description grade subject',
			populate: [
				{ path: 'grade', select: 'gradeName' },
				{ path: 'subject', select: 'subjectName' }
			]
		},
		{ path: 'updatedBy', select: 'name email role' },
		{ path: 'updatedByTeacher', select: 'employeeName employeeId' },
	]);

	res.status(200).json({
		status: 'success',
		data: lessonPlan,
	});
});

exports.deleteLessonPlan = catchAsync(async (req, res, next) => {
	const { id } = req.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return next(new AppError('Invalid lesson plan id', 400));
	}

	const lessonPlan = await LessonPlan.findById(id);

	if (!lessonPlan) {
		return next(new AppError('Lesson plan not found', 404));
	}

	if (req.user?.role === 'user' && req.teacherId) {
		if (!lessonPlan.createdByTeacher || lessonPlan.createdByTeacher.toString() !== req.teacherId.toString()) {
			return next(new AppError('You are not allowed to delete this lesson plan', 403));
		}
	}

	await LessonPlan.deleteOne({ _id: id });

	res.status(204).json({
		status: 'success',
		data: null,
	});
});












