const catchAsync = require('../../utils/catchAsync');
const Grade = require('../../models/Admin/Grade');
const AcademicStudent = require('../../models/users/AcademicStudent');
const OnlineExam = require('../../models/OnlineExam/OnlineExam');
const Assignment = require('../../models/Assignments/Assignment');
const Publish = require('../../models/OnlineExam/Publish');
const PublishAssignment = require('../../models/Assignments/Publish');
const GradeSubject = require('../../models/Admin/GradeSubject');
const SubjectPermissions = require('../../models/Admin/SubjectPermissions');
const Student = require('../../models/users/Student');
const Teacher = require('../../models/users/Teacher');

// Create a new grade
exports.createGrade = catchAsync(async (req, res, next) => {
    try {
        const grade = new Grade(req.body);
        await grade.save();
        res.status(201).json(grade);
    } catch (error) {
        if (error.code === 11000) {
            // Duplicate key error
            return res.status(400).json({ message: 'Grade name must be unique' });
        }
        res.status(400).json({ message: error.message });
    }
});

// Get all grades
exports.getGrades = catchAsync(async (req, res) => {
    const grades = await Grade.find({ status:'Active'});
    res.status(200).json(grades);
});

// Get a single grade by ID
exports.getGradeById = catchAsync(async (req, res) => {
    const grade = await Grade.findById(req.params.id);
    if (!grade) {
        return res.status(404).json({ message: 'Grade not found' });
    }
    res.status(200).json(grade);
});

// Update a grade by ID
exports.updateGrade = catchAsync(async (req, res, next) => {
    try {
        const grade = await Grade.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!grade) {
            return res.status(404).json({ message: 'Grade not found' });
        }
        res.status(200).json(grade);
    } catch (error) {
        if (error.code === 11000) {
            // Duplicate key error
            return res.status(400).json({ message: 'Grade name must be unique' });
        }
        res.status(400).json({ message: error.message });
    }
});

// Delete a grade by ID
exports.deleteGrade = catchAsync(async (req, res) => {
    const gradeId = req.params.id;

    // First, check if the grade exists
    const grade = await Grade.findById(gradeId);
    if (!grade) {
        return res.status(404).json({ message: 'Grade not found' });
    }

    // Check if the grade is being used in AcademicStudent
    const academicStudents = await AcademicStudent.find({ grade: gradeId });
    if (academicStudents.length > 0) {
        return res.status(400).json({ 
            message: `Cannot delete grade. This grade is being used by ${academicStudents.length} student(s). Please update or remove the student records first.` 
        });
    }

    // Check if the grade is being used in OnlineExam
    const onlineExams = await OnlineExam.find({ grade: gradeId });
    if (onlineExams.length > 0) {
        return res.status(400).json({ 
            message: `Cannot delete grade. This grade is being used by ${onlineExams.length} online exam(s). Please delete the exams first.` 
        });
    }

    // Check if the grade is being used in Assignment
    const assignments = await Assignment.find({ grade: gradeId });
    if (assignments.length > 0) {
        return res.status(400).json({ 
            message: `Cannot delete grade. This grade is being used by ${assignments.length} assignment(s). Please delete the assignments first.` 
        });
    }

    // Check if the grade is being used in Publish (Online Exam)
    const onlineExamPublishes = await Publish.find({ grade: gradeId });
    if (onlineExamPublishes.length > 0) {
        return res.status(400).json({ 
            message: `Cannot delete grade. This grade is being used by ${onlineExamPublishes.length} published online exam(s). Please delete the published exams first.` 
        });
    }

    // Check if the grade is being used in PublishAssignment
    const assignmentPublishes = await PublishAssignment.find({ grade: gradeId });
    if (assignmentPublishes.length > 0) {
        return res.status(400).json({ 
            message: `Cannot delete grade. This grade is being used by ${assignmentPublishes.length} published assignment(s). Please delete the published assignments first.` 
        });
    }

    // Check if the grade is being used in GradeSubject
    const gradeSubjects = await GradeSubject.find({ grade: gradeId });
    if (gradeSubjects.length > 0) {
        return res.status(400).json({ 
            message: `Cannot delete grade. This grade is being used by ${gradeSubjects.length} grade subject(s). Please delete the grade subjects first.` 
        });
    }

    // Check if the grade is being used in SubjectPermissions
    const subjectPermissions = await SubjectPermissions.find({ grade: gradeId });
    if (subjectPermissions.length > 0) {
        return res.status(400).json({ 
            message: `Cannot delete grade. This grade is being used by ${subjectPermissions.length} subject permission(s). Please delete the subject permissions first.` 
        });
    }

    // Check if the grade is being used in Student model
    const students = await Student.find({ grade: gradeId });
    if (students.length > 0) {
        return res.status(400).json({ 
            message: `Cannot delete grade. This grade is being used by ${students.length} student(s). Please update the student records first.` 
        });
    }

    // Check if the grade is being used in Teacher model
    const teachers = await Teacher.find({ grade: gradeId });
    if (teachers.length > 0) {
        return res.status(400).json({ 
            message: `Cannot delete grade. This grade is being used by ${teachers.length} teacher(s). Please update the teacher records first.` 
        });
    }

    // If no dependencies exist, proceed with deletion
    await Grade.findByIdAndDelete(gradeId);
    res.status(200).json({ message: 'Grade deleted successfully' });
});
