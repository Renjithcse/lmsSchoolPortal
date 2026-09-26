const express = require('express');
const router = express.Router();
const TimetableController = require('../../controllers/admin/TimetableController');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const checkPermission = require('../../middlewares/checkPermission');

// Apply authentication middleware to all routes
router.use(authMiddlewares.protect);

// Timetable CRUD routes
router
    .route('/')
    .get(
        checkPermission('Read', 'Timetable'),
        TimetableController.getAllTimetables
    )
    .post(
        checkPermission('Create', 'Timetable'),
        TimetableController.createTimetable
    );

// Get available subjects and teachers for timetable creation
router
    .route('/available-subjects-teachers')
    .get(
        checkPermission('Read', 'Timetable'),
        TimetableController.getAvailableSubjectsAndTeachers
    );

// Get school timings for timetable creation
router
    .route('/school-timings')
    .get(
        checkPermission('Read', 'Timetable'),
        TimetableController.getSchoolTimingsForTimetable
    );

// Generate timetable template
router
    .route('/generate-template')
    .get(
        checkPermission('Read', 'Timetable'),
        TimetableController.generateTimetableTemplate
    );

// Get timetable by class (grade, gender, section, academic year, term)
router
    .route('/by-class')
    .get(
        checkPermission('Read', 'Timetable'),
        TimetableController.getTimetableByClass
    );

// Individual timetable routes
router
    .route('/:id')
    .get(
        checkPermission('Read', 'Timetable'),
        TimetableController.getTimetable
    )
    .patch(
        checkPermission('Edit', 'Timetable'),
        TimetableController.updateTimetable
    )
    .delete(
        checkPermission('Delete', 'Timetable'),
        TimetableController.deleteTimetable
    );

module.exports = router;

