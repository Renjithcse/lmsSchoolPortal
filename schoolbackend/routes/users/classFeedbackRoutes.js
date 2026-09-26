const express = require('express');
const checkPermission = require('../../middlewares/checkPermission');
const { checkPermissionOr } = require('../../middlewares/checkPermission');

const classFeedbackController = require('../../controllers/users/classFeedbackController');

const router = express.Router();

// Teacher endpoints (mounted under /api/v1/users/teacher)
router.get(
  '/class-feedback/classes',
  checkPermission("Read", "ClassFeedback"),
  classFeedbackController.getMyClassTeacherClasses
);
router.get(
  '/class-feedback/students',
  checkPermission("Read", "ClassFeedback"),
  classFeedbackController.getStudentsForMyClassTeacherClass
);
router.get(
  '/class-feedback/list',
  checkPermission("Read", "ClassFeedback"),
  classFeedbackController.getMyClassFeedbackForClass
);
router.post(
  '/class-feedback',
  checkPermission("Create", "ClassFeedback"),
  classFeedbackController.createClassFeedback
);
router.patch(
  '/class-feedback/:id',
  checkPermission("Edit", "ClassFeedback"),
  classFeedbackController.updateMyClassFeedback
);
router.delete(
  '/class-feedback/:id',
  // Allow delete for users who can either Delete OR Edit class feedback
  checkPermissionOr([{ action: "Delete", subject: "ClassFeedback" }, { action: "Edit", subject: "ClassFeedback" }]),
  classFeedbackController.deleteMyClassFeedback
);

module.exports = router;

