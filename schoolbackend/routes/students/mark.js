const express = require("express");
const router = express.Router();
const studentController = require('../../controllers/Exam/StudentController');

const authMiddlewares = require("../../middlewares/authMiddlewares");

// Use protect middleware for authentication and getStudentIdFromToken for student-specific routes
router.use(authMiddlewares.protect);
router.use(authMiddlewares.getStudentIdFromToken);

// Get student exam summary
router.route('/summary')
    .get(studentController.getStudentExamSummary);

// Get student subject-wise exam status
router.route('/subject/:subjectId')
    .get(studentController.getStudentSubjectExamStatus);

// Get single exam details
router.route('/exam/:examName')
    .get(studentController.getSingleExamDetails);

// Get all exams for student
router.route('/exams')
    .get(studentController.getStudentAllExams);

// Get exam-wise subjects for student
router.route('/exam-subjects')
    .get(studentController.getStudentExamSubjects);

module.exports = router;
