const express = require('express');
const checkPermission = require('../../middlewares/checkPermission');
const authMiddlewares = require('../../middlewares/authMiddlewares');

const subjectFeedbackController = require('../../controllers/users/subjectFeedbackController');

const router = express.Router();

router.use(authMiddlewares.protect);

// Teacher endpoints (mounted under /api/v1/users/teacher)
router.get(
  '/subject-feedback/students',
  checkPermission("Read", "SubjectFeedback"),
  subjectFeedbackController.getStudentsForSubjectFeedback
);
router.post(
  '/subject-feedback',
  checkPermission("Create", "SubjectFeedback"),
  subjectFeedbackController.createSubjectFeedback
);
router.get(
  '/subject-feedback/list',
  checkPermission("Read", "SubjectFeedback"),
  subjectFeedbackController.getMySubjectFeedbackList
);
router.patch(
  '/subject-feedback/:id',
  checkPermission("Edit", "SubjectFeedback"),
  subjectFeedbackController.updateMySubjectFeedback
);
router.delete(
  '/subject-feedback/:id',
  checkPermission("Delete", "SubjectFeedback"),
  subjectFeedbackController.deleteMySubjectFeedback
);

module.exports = router;

