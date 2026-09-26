const Subject = require('../../models/Admin/Subject');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const OnlineExam = require('../../models/OnlineExam/OnlineExam');
const Assignment = require('../../models/Assignments/Assignment');
const Publish = require('../../models/OnlineExam/Publish');
const PublishAssignment = require('../../models/Assignments/Publish');
const GradeSubject = require('../../models/Admin/GradeSubject');
const SubjectPermissions = require('../../models/Admin/SubjectPermissions');
const StudentSubject = require('../../models/Admin/StudentSubject');
const GroupSubject = require('../../models/Admin/GroupSubject');
const QuestionBank = require('../../models/OnlineExam/QuestionBank');
const Question = require('../../models/OnlineExam/Question');

// Create a new Subject
exports.createSubject = catchAsync(async (req, res, next) => {
    const subject = await Subject.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            subject,
        },
    });
});

// Get all Subjects
exports.getSubjects = catchAsync(async (req, res, next) => {
    const subjects = await Subject.find();

    res.status(200).json({
        status: 'success',
        results: subjects.length,
        data: {
            subjects,
        },
    });
});

// Get a single Subject by ID
exports.getSubjectById = catchAsync(async (req, res, next) => {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
        return next(new AppError('No subject found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            subject,
        },
    });
});

// Update a Subject by ID
exports.updateSubject = catchAsync(async (req, res, next) => {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!subject) {
        return next(new AppError('No subject found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            subject,
        },
    });
});

// Delete a Subject by ID
exports.deleteSubject = catchAsync(async (req, res, next) => {
    const subjectId = req.params.id;

    // First, check if the subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
        return next(new AppError('No subject found with that ID', 404));
    }

    // Check if the subject is being used in OnlineExam
    const onlineExams = await OnlineExam.find({ subjectId: subjectId });
    if (onlineExams.length > 0) {
        return next(new AppError(
            `Cannot delete subject. This subject is being used by ${onlineExams.length} online exam(s). Please delete the exams first.`, 
            400
        ));
    }

    // Check if the subject is being used in Assignment
    const assignments = await Assignment.find({ subjectId: subjectId });
    if (assignments.length > 0) {
        return next(new AppError(
            `Cannot delete subject. This subject is being used by ${assignments.length} assignment(s). Please delete the assignments first.`, 
            400
        ));
    }

    // Check if the subject is being used in Publish (Online Exam)
    const onlineExamPublishes = await Publish.find({ 
        exam: { $in: onlineExams.map(exam => exam._id) }
    });
    if (onlineExamPublishes.length > 0) {
        return next(new AppError(
            `Cannot delete subject. This subject is being used by ${onlineExamPublishes.length} published online exam(s). Please delete the published exams first.`, 
            400
        ));
    }

    // Check if the subject is being used in PublishAssignment
    const assignmentPublishes = await PublishAssignment.find({ 
        assignment: { $in: assignments.map(assignment => assignment._id) }
    });
    if (assignmentPublishes.length > 0) {
        return next(new AppError(
            `Cannot delete subject. This subject is being used by ${assignmentPublishes.length} published assignment(s). Please delete the published assignments first.`, 
            400
        ));
    }

    // Check if the subject is being used in GradeSubject
    const gradeSubjects = await GradeSubject.find({ subject: subjectId });
    if (gradeSubjects.length > 0) {
        return next(new AppError(
            `Cannot delete subject. This subject is being used by ${gradeSubjects.length} grade subject(s). Please delete the grade subjects first.`, 
            400
        ));
    }

    // Check if the subject is being used in SubjectPermissions
    const subjectPermissions = await SubjectPermissions.find({ subject: subjectId });
    if (subjectPermissions.length > 0) {
        return next(new AppError(
            `Cannot delete subject. This subject is being used by ${subjectPermissions.length} subject permission(s). Please delete the subject permissions first.`, 
            400
        ));
    }

    // Check if the subject is being used in StudentSubject
    const studentSubjects = await StudentSubject.find({ subject: subjectId });
    if (studentSubjects.length > 0) {
        return next(new AppError(
            `Cannot delete subject. This subject is being used by ${studentSubjects.length} student subject record(s). Please delete the student subject records first.`, 
            400
        ));
    }

    // Check if the subject is being used in GroupSubject
    const groupSubjects = await GroupSubject.find({ subjects: subjectId });
    if (groupSubjects.length > 0) {
        return next(new AppError(
            `Cannot delete subject. This subject is being used by ${groupSubjects.length} group subject(s). Please delete the group subjects first.`, 
            400
        ));
    }

    // Check if the subject is being used in QuestionBank
    const questionBanks = await QuestionBank.find({ subject: subjectId });
    if (questionBanks.length > 0) {
        return next(new AppError(
            `Cannot delete subject. This subject is being used by ${questionBanks.length} question bank(s). Please delete the question banks first.`, 
            400
        ));
    }

    // Check if the subject is being used in Question (through question banks)
    const questions = await Question.find({ 
        questionBank: { $in: questionBanks.map(qb => qb._id) }
    });
    if (questions.length > 0) {
        return next(new AppError(
            `Cannot delete subject. This subject is being used by ${questions.length} question(s). Please delete the questions first.`, 
            400
        ));
    }

    // If no dependencies exist, proceed with deletion
    await Subject.findByIdAndDelete(subjectId);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});
