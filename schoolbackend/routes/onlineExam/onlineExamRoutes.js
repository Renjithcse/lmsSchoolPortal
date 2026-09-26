const express = require('express');
const onlineExamController = require('../../controllers/onlineExam/onlineExamController');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const questionBankController = require('../../controllers/onlineExam/questionBankController');
const questionController = require('../../controllers/onlineExam/questionController');
const publishController = require('../../controllers/onlineExam/publishController');
const checkPermission = require('../../middlewares/checkPermission');



const router = express.Router();

router.use(authMiddlewares.protect);


router
	.route('/exam')
	.get(checkPermission("Read", "Exams"), onlineExamController.getAllExams)
	.post(checkPermission("Create", "Exams"), onlineExamController.createExam);

router
	.route('/exam/:id')
	.get(checkPermission("Read", "Exams"), onlineExamController.getExam)
	.patch(checkPermission("Edit", "Exams"), onlineExamController.updateExam)
	.delete(checkPermission("Delete", "Exams"), onlineExamController.deleteExam);


//Question Banks
router
	.route('/question_bank')
	.get(checkPermission("Read", "QuestionBank"), questionBankController.getAllQuestionBanksList)
	.post(checkPermission("Create", "QuestionBank"), questionBankController.createQuestionBank);


router
	.route('/question_bank/:id')
	.get(checkPermission("Read", "QuestionBank"), questionBankController.viewQuestionBank)
	.patch(checkPermission("Edit", "QuestionBank"), questionBankController.updateQuestionBank)
	.delete(checkPermission("Delete", "QuestionBank"), questionBankController.deleteQuestionBank);


//Question 

router
	.route('/question')
	.get(checkPermission("Read", "QuestionBank"), questionController.getAllQuestions)
	.post(checkPermission("Create", "QuestionBank"), questionController.createQuestion);

router
	.route('/question/:id')
	.patch(checkPermission("Edit", "Questions"), questionController.updateQuestion)
	.delete(checkPermission("Delete", "Questions"), questionController.deleteQuestion);

//publish exam
router
	.route('/publish')
	.post(checkPermission("Create", "PublishedExams"), publishController.createPublish)
	.get(checkPermission("Read", "PublishedExams"), publishController.getAllPublishedExamsByExamId);

router
	.route('/publish/:publishId')
	.get(checkPermission("Read", "PublishedExams"), publishController.getSinglePublishedExamDetails)
	.put(checkPermission("Edit", "PublishedExams"), publishController.updatePublishedExamDates)
	.patch(checkPermission("Edit", "PublishedExams"), publishController.updatePublishedExamDates)
	.delete(checkPermission("Delete", "PublishedExams"), publishController.deletePublishedExam);

router.route('/getNotPublishedSections').get(checkPermission("Read", "Exams"), publishController.getAllSectionsWithUnpublishedExams);

router.route('/publishedStudents').get(checkPermission("Read", "PublishedExams"), publishController.getAllStudentsUnderPublishId);
router.route('/attendedUnAttendedStudents/:publishId').get(checkPermission("Read", "PublishedExams"), publishController.getAttendedAndUnattendedStudents);
router.route('/retest').post(checkPermission("Create", "PublishedExams"), publishController.createPublishWithSelectedStudents);

// Exam Report
router.route('/report/:examId').get(checkPermission("Read", "Exams"), publishController.getExamReport);

module.exports = router;
