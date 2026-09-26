const express = require('express');
const gradeSubjectController = require('../../controllers/admin/gradeSubjectController');
const teacherController = require('../../controllers/users/teacherController');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const checkPermission = require('../../middlewares/checkPermission');

const router = express.Router();

// Protect all routes
router.use(authMiddlewares.protect);

// Route to fetch unassigned subjects
router.get('/unassigned-subjects', checkPermission("Read", "GradeSubject"), gradeSubjectController.getUnassignedSubjects);
router.get('/uniquSubjects/:academicYear/:grade', checkPermission("Read", "GradeSubject"), gradeSubjectController.getUniqueSubjects);
router.get('/check-duplicates', checkPermission("Read", "GradeSubject"), gradeSubjectController.findDuplicateGradeSubjects);
router.get('/available-genders-copy', checkPermission("Read", "GradeSubject"), gradeSubjectController.getAvailableGendersForCopy);
router.get('/available-sections-copy', checkPermission("Read", "GradeSubject"), gradeSubjectController.getAvailableSectionsForCopy);
router.post('/copy-subjects', checkPermission("Create", "GradeSubject"), gradeSubjectController.copyGradeSubjects);
router.post('/bulk-assign-teacher', checkPermission("Edit", "GradeSubject"), gradeSubjectController.bulkAssignTeacher);
router.route('/list-teachers').get(checkPermission("Read", "Teacher"), teacherController.getTeachersNameAndId)
router.get('/class-teacher', checkPermission("Read", "GradeSubject"), gradeSubjectController.getClassTeacher);
router.post('/class-teacher', checkPermission("Edit", "GradeSubject"), gradeSubjectController.setClassTeacher);

router
    .route('/')
    .post(checkPermission("Create", "GradeSubject"), gradeSubjectController.createGradeSubjects)
    .get(checkPermission("Read", "GradeSubject"), gradeSubjectController.getGradeSubjects);

router
    .route('/:id')
    .get(checkPermission("Read", "GradeSubject"), gradeSubjectController.getGradeSubjectById)
    .patch(checkPermission("Edit", "GradeSubject"), gradeSubjectController.updateGradeSubject)
    .delete(checkPermission("Delete", "GradeSubject"), gradeSubjectController.deleteGradeSubject);

module.exports = router;
