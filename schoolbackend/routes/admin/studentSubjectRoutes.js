const express = require('express');
const studentSubjectController = require('../../controllers/admin/studentSubjectController');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const checkPermission = require('../../middlewares/checkPermission');

const router = express.Router();

// Protect all routes with auth middleware
router.use(authMiddlewares.protect);

router
    .route('/')
    .get(checkPermission("Read", "SubjectStudent"), studentSubjectController.getAllStudents)
    .post(checkPermission("Create", "SubjectStudent"), studentSubjectController.registerStudents);

// // Route to get StudentSubjects based on gradeSubjectId
// router.get('/gradeSubject/:gradeSubjectId', studentSubjectController.getStudentSubjectsByGradeSubject);

router
    .route('/:id')
    // .get(studentSubjectController.getStudentSubjectById)
    // .patch(studentSubjectController.updateStudentSubject)
    .delete(checkPermission("Delete", "SubjectStudent"), studentSubjectController.deleteStudent);

module.exports = router;