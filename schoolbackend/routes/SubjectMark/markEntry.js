const express = require('express');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const checkPermission = require('../../middlewares/checkPermission');
const { getAllStudentMarks, insertStudentMarks } = require('../../controllers/Exam/MarkEntryController');

const router = express.Router();

router.use(authMiddlewares.protect);


router
    .route('/')
    .get(checkPermission("Read", "ExamMark"), getAllStudentMarks)
    .post(checkPermission("Create", "ExamMark"), insertStudentMarks)

module.exports = router;