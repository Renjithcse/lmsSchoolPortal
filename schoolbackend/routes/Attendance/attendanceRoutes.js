const express = require('express');
const router = express.Router();
const authMiddlewares = require('../../middlewares/authMiddlewares');
const checkPermission = require('../../middlewares/checkPermission');
const attendanceController = require('../../controllers/Attendance/attendanceController');

// Public routes (for biometric, RFID, mobile attendance)
router.post('/mark', attendanceController.markAttendance);
router.post('/bulk-mark', attendanceController.bulkMarkAttendance);

// Protected routes
router.use(authMiddlewares.protect);

// Get attendance data
router.get('/by-date', attendanceController.getAttendanceByDate);
router.get('/by-date-range', attendanceController.getAttendanceByDateRange);
router.get('/stats', attendanceController.getAttendanceStats);
router.get('/dashboard', attendanceController.getAttendanceDashboard);
router.get('/registered-students', attendanceController.getRegisteredActiveStudents);
router.get('/summary-report', attendanceController.getAttendanceSummaryReport);
router.get('/classwise-report', attendanceController.getClasswiseAttendanceReport);
router.get('/today-overall-report', attendanceController.getTodayOverallReport);
router.get('/termwise-report', attendanceController.getTermwiseAttendanceReport);

// Student attendance
router.get('/student/:studentId', attendanceController.getStudentAttendance);

// Teacher attendance
router.get('/teacher/:teacherId', attendanceController.getTeacherAttendance);

// Admin routes (require admin permissions)
router.use(checkPermission("Read", "Attendance"));

// Update and delete attendance
router.patch('/:id', attendanceController.updateAttendance);
router.delete('/:id', attendanceController.deleteAttendance);

module.exports = router;
