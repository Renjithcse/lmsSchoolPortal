const express = require('express');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const lessonPlanController = require('../../controllers/users/lessonPlanController');

const router = express.Router();

router.use(authMiddlewares.protect);

router.get('/subjects', lessonPlanController.getStudentLessonPlanSubjects);
router.get('/subject/:subjectId', lessonPlanController.getStudentLessonPlansBySubject);
router.get('/:id', lessonPlanController.getStudentLessonPlan);

module.exports = router;












