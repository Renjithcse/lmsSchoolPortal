const Section = require('../../models/Admin/Section');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const Student = require('../../models/users/Student');
const Teacher = require('../../models/users/Teacher');
const AcademicStudent = require('../../models/users/AcademicStudent');
const OnlineExam = require('../../models/OnlineExam/OnlineExam');
const Assignment = require('../../models/Assignments/Assignment');
const Publish = require('../../models/OnlineExam/Publish');
const PublishAssignment = require('../../models/Assignments/Publish');
const GradeSubject = require('../../models/Admin/GradeSubject');
const SubjectPermissions = require('../../models/Admin/SubjectPermissions');

// Create a new section
exports.createSection = catchAsync(async (req, res, next) => {
    const { sectionName, status } = req.body;

    const section = await Section.create({
        sectionName,
        status,
        createdBy: req.user._id,
    });

    res.status(201).json({
        status: 'success',
        data: {
            section,
        },
    });
});

// Get all sections
exports.getSections = catchAsync(async (req, res, next) => {
    const sections = await Section.find({ status: 'active' });

    res.status(200).json({
        status: 'success',
        results: sections.length,
        data: {
            sections,
        },
    });
});

// Get a single section by ID
exports.getSectionById = catchAsync(async (req, res, next) => {
    const section = await Section.findById(req.params.id);

    if (!section) {
        return next(new AppError('No section found with this ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            section,
        },
    });
});

// Update a section
exports.updateSection = catchAsync(async (req, res, next) => {
    const section = await Section.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!section) {
        return next(new AppError('No section found with this ID', 404));
    }

    section.updatedBy = req.user._id;
    await section.save();

    res.status(200).json({
        status: 'success',
        data: {
            section,
        },
    });
});

// Delete a section
exports.deleteSection = catchAsync(async (req, res, next) => {
    const sectionId = req.params.id;

    // First, check if the section exists
    const section = await Section.findById(sectionId);
    if (!section) {
        return next(new AppError('No section found with this ID', 404));
    }

    // Check if the section is being used in Student model
    const students = await Student.find({ section: sectionId });
    if (students.length > 0) {
        return next(new AppError(
            `Cannot delete section. This section is being used by ${students.length} student(s). Please update the student records first.`, 
            400
        ));
    }

    // Check if the section is being used in Teacher model
    const teachers = await Teacher.find({ section: sectionId });
    if (teachers.length > 0) {
        return next(new AppError(
            `Cannot delete section. This section is being used by ${teachers.length} teacher(s). Please update the teacher records first.`, 
            400
        ));
    }

    // Check if the section is being used in AcademicStudent model
    const academicStudents = await AcademicStudent.find({ section: sectionId });
    if (academicStudents.length > 0) {
        return next(new AppError(
            `Cannot delete section. This section is being used by ${academicStudents.length} academic student record(s). Please update the academic student records first.`, 
            400
        ));
    }

    // Check if the section is being used in OnlineExam
    const onlineExams = await OnlineExam.find({ section: sectionId });
    if (onlineExams.length > 0) {
        return next(new AppError(
            `Cannot delete section. This section is being used by ${onlineExams.length} online exam(s). Please delete the exams first.`, 
            400
        ));
    }

    // Check if the section is being used in Assignment
    const assignments = await Assignment.find({ section: sectionId });
    if (assignments.length > 0) {
        return next(new AppError(
            `Cannot delete section. This section is being used by ${assignments.length} assignment(s). Please delete the assignments first.`, 
            400
        ));
    }

    // Check if the section is being used in Publish (Online Exam)
    const onlineExamPublishes = await Publish.find({ section: sectionId });
    if (onlineExamPublishes.length > 0) {
        return next(new AppError(
            `Cannot delete section. This section is being used by ${onlineExamPublishes.length} published online exam(s). Please delete the published exams first.`, 
            400
        ));
    }

    // Check if the section is being used in PublishAssignment
    const assignmentPublishes = await PublishAssignment.find({ section: sectionId });
    if (assignmentPublishes.length > 0) {
        return next(new AppError(
            `Cannot delete section. This section is being used by ${assignmentPublishes.length} published assignment(s). Please delete the published assignments first.`, 
            400
        ));
    }

    // Check if the section is being used in GradeSubject
    const gradeSubjects = await GradeSubject.find({ section: sectionId });
    if (gradeSubjects.length > 0) {
        return next(new AppError(
            `Cannot delete section. This section is being used by ${gradeSubjects.length} grade subject(s). Please delete the grade subjects first.`, 
            400
        ));
    }

    // Check if the section is being used in SubjectPermissions
    const subjectPermissions = await SubjectPermissions.find({ section: sectionId });
    if (subjectPermissions.length > 0) {
        return next(new AppError(
            `Cannot delete section. This section is being used by ${subjectPermissions.length} subject permission(s). Please delete the subject permissions first.`, 
            400
        ));
    }

    // If no dependencies exist, proceed with deletion
    await Section.findByIdAndDelete(sectionId);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});
