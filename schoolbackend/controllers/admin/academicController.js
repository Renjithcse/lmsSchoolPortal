const Academic = require('../../models/Admin/AcademicYear');
const catchAsync = require('../../utils/catchAsync');
const AcademicStudent = require('../../models/users/AcademicStudent');
const OnlineExam = require('../../models/OnlineExam/OnlineExam');
const Assignment = require('../../models/Assignments/Assignment');
const GradeSubject = require('../../models/Admin/GradeSubject');
const SubjectPermissions = require('../../models/Admin/SubjectPermissions');

// Create a new academic year with terms
exports.createAcademic = catchAsync(async (req, res) => {
	const academic = new Academic(req.body);
	academic.user = req.user._id;
	await academic.save();
	res.status(201).json(academic);
});

// Get all academic years
exports.getAcademics = catchAsync(async (req, res) => {
	const academics = await Academic.find();
	res.status(200).json(academics);
});

// Get a single academic year by ID
exports.getAcademicById = catchAsync(async (req, res) => {
	const academic = await Academic.findById(req.params.id);
	if (!academic) {
		return res.status(404).json({ message: 'Academic record not found' });
	}
	res.status(200).json(academic);
});

// Update an academic year by ID
exports.updateAcademic = catchAsync(async (req, res) => {
	const academic = await Academic.findByIdAndUpdate(req.params.id, req.body, { new: true });
	if (!academic) {
		return res.status(404).json({ message: 'Academic record not found' });
	}
	res.status(200).json(academic);
});

// Delete an academic year by ID
exports.deleteAcademic = catchAsync(async (req, res) => {
	const academicYearId = req.params.id;

	// First, check if the academic year exists
	const academic = await Academic.findById(academicYearId);
	if (!academic) {
		return res.status(404).json({ message: 'Academic record not found' });
	}

	// Check if the academic year is being used in AcademicStudent
	
	const academicStudents = await AcademicStudent.find({ academicYear: academicYearId });
	if (academicStudents.length > 0) {
		return res.status(400).json({ 
			message: `Cannot delete academic year. This academic year is being used by ${academicStudents.length} student(s). Please update or remove the student records first.` 
		});
	}

	// Check if the academic year is being used in OnlineExam
	
	const onlineExams = await OnlineExam.find({ academicYear: academicYearId });
	if (onlineExams.length > 0) {
		return res.status(400).json({ 
			message: `Cannot delete academic year. This academic year is being used by ${onlineExams.length} online exam(s). Please delete the exams first.` 
		});
	}

	// Check if the academic year is being used in Assignment
	const assignments = await Assignment.find({ academicYear: academicYearId });
	if (assignments.length > 0) {
		return res.status(400).json({ 
			message: `Cannot delete academic year. This academic year is being used by ${assignments.length} assignment(s). Please delete the assignments first.` 
		});
	}

	// Check if the academic year is being used in GradeSubject
	const gradeSubjects = await GradeSubject.find({ academicYear: academicYearId });
	if (gradeSubjects.length > 0) {
		return res.status(400).json({ 
			message: `Cannot delete academic year. This academic year is being used by ${gradeSubjects.length} grade subject(s). Please delete the grade subjects first.` 
		});
	}

	// Check if the academic year is being used in SubjectPermissions
	const subjectPermissions = await SubjectPermissions.find({ academicYear: academicYearId });
	if (subjectPermissions.length > 0) {
		return res.status(400).json({ 
			message: `Cannot delete academic year. This academic year is being used by ${subjectPermissions.length} subject permission(s). Please delete the subject permissions first.` 
		});
	}

	// If no dependencies exist, proceed with deletion
	await Academic.findByIdAndDelete(academicYearId);
	res.status(200).json({ message: 'Academic record deleted successfully' });
});
