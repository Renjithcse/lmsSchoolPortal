const express = require('express');
const router = express.Router();
const studentController = require('../../controllers/users/studentController');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const checkPermission = require('../../middlewares/checkPermission');

router.get('/dashboard', authMiddlewares.protect, checkPermission("Read", "Student"), studentController.getStudentDashboardStats);

// Create a new student
router.post('/students', authMiddlewares.protect, checkPermission("Create", "Student"), studentController.createStudent);

// Get all students
router.get('/students', authMiddlewares.protect, checkPermission("Read", "Student"), studentController.classStudents);

// Get a single student by ID
router.get('/students/:id', authMiddlewares.protect, checkPermission("Read", "Student"), studentController.getStudentById);

// Update a student by ID
router.put('/students/:id', authMiddlewares.protect, checkPermission("Edit", "Student"), studentController.updateStudent);

// Delete a student by ID
router.delete('/students/:id', authMiddlewares.protect, checkPermission("Delete", "Student"), studentController.deleteStudent);

//Get grades
router.get('/grades', authMiddlewares.protect, checkPermission("Read", "Grade"), studentController.getGrades);
router.get('/genders', authMiddlewares.protect, checkPermission("Read", "Student"), studentController.getGenders);

//Get sections
router.get('/sections', authMiddlewares.protect, checkPermission("Read", "Section"), studentController.getSections);
router.post('/verifyStudent', studentController.verifyStudent);

module.exports = router;
