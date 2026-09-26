const express = require("express");
const router = express.Router();
const studentController = require('../../controllers/onlineExam/studentController');


const authMiddlewares = require("../../middlewares/authMiddlewares");

// Use protect middleware for authentication and getStudentIdFromToken for student-specific routes
router.use(authMiddlewares.protect);
router.use(authMiddlewares.getStudentIdFromToken);

router.route('/')
    .get(studentController.getStudentExamSummary);

router.route('/subject/:subjectId').get(studentController.getStudentSubjectExamStatus);

router.route('/exam/:publishId').get(studentController.getSingleExamDetails);

router.route('/attended').get(studentController.getStudentAttendedExamDetails);

router.route('/submit').post(studentController.submitStudentExamAnswers);

// router.route('/subject/:id').get(publishController.getStudentsSubjectWiseAssignments);
// router.route('/:assignmentId').get(publishController.getSingleAssignment);


module.exports = router;