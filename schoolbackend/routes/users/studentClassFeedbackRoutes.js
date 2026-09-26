const express = require('express');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const classFeedbackController = require('../../controllers/users/classFeedbackController');

const router = express.Router();

router.use(authMiddlewares.protect);

router.get('/my', classFeedbackController.getMyClassFeedback);

module.exports = router;

