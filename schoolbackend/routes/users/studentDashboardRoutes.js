const express = require('express');
const router = express.Router();
const studentDashboardController = require('../../controllers/users/studentDashboardController');
const authMiddlewares = require('../../middlewares/authMiddlewares');

// Get comprehensive student dashboard data
router.get('/dashboard', authMiddlewares.protect, studentDashboardController.getStudentDashboard);

// Get student performance analytics
router.get('/analytics', authMiddlewares.protect, studentDashboardController.getStudentPerformanceAnalytics);

// Get student's timetable
router.get('/timetable', authMiddlewares.protect, studentDashboardController.getStudentTimetable);

module.exports = router;
