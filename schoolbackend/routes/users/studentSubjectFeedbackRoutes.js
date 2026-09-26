const express = require('express');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const subjectFeedbackController = require('../../controllers/users/subjectFeedbackController');

const router = express.Router();

router.use(authMiddlewares.protect);

router.get('/my', subjectFeedbackController.getMySubjectFeedback);

module.exports = router;

