const EventGallery = require('../../models/Admin/EventGallery');
const Student = require('../../models/users/Student');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const APIFeatures = require('../../utils/apiFeatures');
const mongoose = require('mongoose');

// Helper function to check if student can view event gallery
const canStudentViewEventGallery = async (eventGallery, student) => {
	// Must be published
	if (eventGallery.status !== 'Published') {
		return false;
	}

	// Check publishTo
	if (!eventGallery.publishTo) {
		return false;
	}

	// Must be published to students
	if (
		eventGallery.publishTo !== 'All Students' &&
		eventGallery.publishTo !== 'Both Teachers and Students' &&
		eventGallery.publishTo !== 'Specific Students'
	) {
		return false;
	}

	// If no student targeting, allow access
	if (!eventGallery.studentTargeting) {
		return true;
	}

	const targeting = eventGallery.studentTargeting;

	// Check academic year
	if (targeting.academicYear) {
		const AcademicYear = mongoose.model('AcademicYear');
		const academicYearObj = await AcademicYear.findOne({
			academicYear: targeting.academicYear,
		}).select('_id');
		if (
			academicYearObj &&
			student.academicYear &&
			academicYearObj._id.toString() !== student.academicYear.toString()
		) {
			return false;
		}
	}

	// Check targeting type
	const targetType = targeting.targetType || 'All Students';

	if (targetType === 'All Students') {
		return true;
	}

	// Gender check
	if (targeting.gender && targeting.gender !== 'Both') {
		if (student.gender && student.gender.toLowerCase() !== targeting.gender.toLowerCase()) {
			return false;
		}
	}

	// Grade Wise or Grade and Gender Wise
	if (targetType === 'Grade Wise' || targetType === 'Grade and Gender Wise') {
		if (targeting.grades && targeting.grades.length > 0) {
			// Convert grade names to ObjectIds for comparison
			const Grade = mongoose.model('Grade');
			const gradeObjects = await Grade.find({
				gradeName: { $in: targeting.grades },
			}).select('_id');
			const gradeIds = gradeObjects.map((g) => g._id.toString());
			const studentGradeId = student.grade?.toString();
			if (!gradeIds.includes(studentGradeId)) {
				return false;
			}
		}
	}

	// Section Wise
	if (targetType === 'Section Wise') {
		// Check grade
		if (targeting.grade && targeting.grade._id) {
			const studentGradeId = student.grade?.toString();
			if (targeting.grade._id.toString() !== studentGradeId) {
				return false;
			}
		}

		// Check section gender
		if (targeting.sectionGender && targeting.sectionGender !== 'Both') {
			if (
				student.gender &&
				student.gender.toLowerCase() !== targeting.sectionGender.toLowerCase()
			) {
				return false;
			}
		}

		// Check sections
		if (targeting.sections && targeting.sections.length > 0) {
			const studentSectionId = student.section?.toString();
			const hasMatchingSection = targeting.sections.some(
				(section) => section._id?.toString() === studentSectionId
			);
			if (!hasMatchingSection) {
				return false;
			}
		}
	}

	return true;
};

// Helper function to filter accessible event galleries
const filterAccessibleEventGalleries = async (allEventGalleries, student) => {
	const accessibleEventGalleries = [];
	for (const eventGallery of allEventGalleries) {
		const canView = await canStudentViewEventGallery(eventGallery, student);
		if (canView) {
			accessibleEventGalleries.push(eventGallery);
		}
	}
	return accessibleEventGalleries;
};

// Get all event galleries visible to the student
exports.getAllStudentEventGalleries = catchAsync(async (req, res, next) => {
	// Get student details
	const student = await Student.findOne({ userId: req.user.id });
	if (!student) {
		return next(new AppError('Student profile not found', 404));
	}

	// Get all published event galleries
	const allEventGalleries = await EventGallery.find({
		status: 'Published',
	})
		.populate('createdBy', 'name email')
		.populate('updatedBy', 'name email')
		.sort({ eventDate: -1, createdAt: -1 })
		.lean();

	// Filter event galleries based on targeting rules
	const accessibleEventGalleries = await filterAccessibleEventGalleries(
		allEventGalleries,
		student
	);

	// Apply additional filtering and pagination
	let query = EventGallery.find({
		_id: { $in: accessibleEventGalleries.map((event) => event._id) },
	})
		.populate('createdBy', 'name email')
		.populate('updatedBy', 'name email');

	const features = new APIFeatures(query, req.query).filter().sort().limitFields().paginate();

	const eventGalleries = await features.query;

	res.status(200).json({
		status: 'success',
		results: eventGalleries.length,
		total: accessibleEventGalleries.length,
		data: eventGalleries,
	});
});

// Get event gallery by ID for student
exports.getStudentEventGalleryById = catchAsync(async (req, res, next) => {
	const { id } = req.params;

	// Get student details
	const student = await Student.findOne({ userId: req.user.id });
	if (!student) {
		return next(new AppError('Student profile not found', 404));
	}

	const eventGallery = await EventGallery.findById(id)
		.populate('createdBy', 'name email')
		.populate('updatedBy', 'name email')
		.lean();

	if (!eventGallery) {
		return next(new AppError('Event gallery not found', 404));
	}

	// Check if student can view this event gallery
	const canView = await canStudentViewEventGallery(eventGallery, student);
	if (!canView) {
		return next(new AppError('You do not have access to this event gallery', 403));
	}

	res.status(200).json({
		status: 'success',
		data: eventGallery,
	});
});
