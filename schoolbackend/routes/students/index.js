const express = require('express');
const router = express.Router();
const assignmentRoutes = require('./assignments');
const onLineExamRoutes = require('./onlineExam');
const studentMarksRoutes = require('./mark');

router.use('/assignments', assignmentRoutes);
router.use('/onlineExam', onLineExamRoutes);
router.use('/mark', studentMarksRoutes);

module.exports = router;