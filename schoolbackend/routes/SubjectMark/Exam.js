const express = require('express');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const { getAllExams, createExam, deleteExam, updateExam } = require('../../controllers/Exam/ExamController');

const router = express.Router();

router.use(authMiddlewares.protect);


router
    .route('/')
    .get(getAllExams)
    .post(createExam)
    

router.route('/:id')
   .delete(deleteExam)
   .put(updateExam)

module.exports = router;