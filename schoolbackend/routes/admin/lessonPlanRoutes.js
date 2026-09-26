const express = require('express');
const lessonPlanController = require('../../controllers/admin/lessonPlanController');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const checkPermission = require('../../middlewares/checkPermission');

const router = express.Router();

router.use(authMiddlewares.protect);

router
  .route('/available-subjects')
  .get(checkPermission('Read', 'LessonPlans'), lessonPlanController.getAvailableSubjects);

router
  .route('/')
  .get(checkPermission('Read', 'LessonPlans'), lessonPlanController.getLessonPlans)
  .post(checkPermission('Create', 'LessonPlans'), lessonPlanController.createLessonPlan);

router
  .route('/:id/status')
  .patch(checkPermission('Edit', 'LessonPlans'), lessonPlanController.updateLessonPlanStatus);

router
  .route('/:id/published-progress')
  .get(
    checkPermission('Read', 'LessonPlans'),
    lessonPlanController.getLessonPlanPublishedProgress
  )
  .patch(
    checkPermission('Edit', 'LessonPlans'),
    lessonPlanController.updateLessonPlanPublishedProgress
  );

router
  .route('/:id')
  .get(checkPermission('Read', 'LessonPlans'), lessonPlanController.getLessonPlan)
  .patch(checkPermission('Edit', 'LessonPlans'), lessonPlanController.updateLessonPlan)
  .delete(checkPermission('Delete', 'LessonPlans'), lessonPlanController.deleteLessonPlan);

module.exports = router;












