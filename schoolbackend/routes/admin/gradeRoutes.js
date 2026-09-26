const express = require('express');
const router = express.Router();
const gradeController = require('../../controllers/admin/gradeController');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const checkPermission = require('../../middlewares/checkPermission');


// Routes for all grades (GET, POST)
router.route('/')
    .get(authMiddlewares.protect, checkPermission("Read", "Grade"), gradeController.getGrades)
    .post(authMiddlewares.protect, checkPermission("Create", "Grade"), gradeController.createGrade);

// Routes for specific grade by ID (GET, PUT, DELETE)
router.route('/:id')
    .get(authMiddlewares.protect, checkPermission("Read", "Grade"), gradeController.getGradeById)
    .put(authMiddlewares.protect, checkPermission("Edit", "Grade"), gradeController.updateGrade)
    .delete(authMiddlewares.protect, checkPermission("Delete", "Grade"), gradeController.deleteGrade);

module.exports = router;
