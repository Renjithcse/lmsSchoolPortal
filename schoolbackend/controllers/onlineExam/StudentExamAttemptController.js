const StudentExamAttempt = require('../../models/OnlineExam/StudentExamAttempt');
const AcademicStudent = require('../../models/users/AcademicStudent');
const StudentPerformance = require('../../models/OnlineExam/StudentPerformance');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');

// Function to create student exam attempts based on academicYear, grade, gender, and section
exports.createStudentExamAttempts = catchAsync(async (req, res, next) => {
    const { publishId, academicYear, grade, gender, section, students, exam } = req.body;

    let studentsToCreate = [];

    // If specific students are provided in the request, use them
    if (students && students.length > 0) {
        studentsToCreate = students;
    } else {
        // If no students array is provided, find students based on academicYear, grade, gender, and section
        studentsToCreate = await AcademicStudent.find({
            academicYear,
            grade:grade,
            gender:gender,
            section:section,
            status: 'active',
        }).select('studentId');  // Fetch student IDs for the given filters
    }

    // If no students are found, return an error
    if (studentsToCreate.length === 0) {
        return next(new AppError('No students found for the given academicYear, grade, gender, and section', 404));
    }

    // Create exam attempt entries for each student
    const attemptsToCreate = studentsToCreate.map(student => ({
        studentId: student.studentId,  // Use the student ID
        publishId,  // Provided publish ID
        totalQuestions: req.body.totalQuestions,  // Total questions in the published exam
    }));

    // Insert all exam attempts at once
    const newAttempts = await StudentExamAttempt.insertMany(attemptsToCreate);

   // Prepare bulk operations for upsert
    const bulkOps = studentsToCreate.map((item) => ({
        updateOne: {
            filter: { studentId: item.studentId, examId: exam },  // Check if entry exists
            update: {
                $setOnInsert: {
                    studentId: item.studentId,
                    examId: exam,
                    attempts: 0
                }
            },
            upsert: true  // If no match is found, insert a new document
        }
    }));

    // Execute bulkWrite operation
    const result = await StudentPerformance.bulkWrite(bulkOps);

    res.status(201).json({
        status: 'success',
        data: {
            attempts: newAttempts,
        },
    });
});
