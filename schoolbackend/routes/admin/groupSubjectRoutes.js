const express = require('express');
const groupSubjectController = require('../../controllers/admin/groupSubjectController');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const checkPermission = require('../../middlewares/checkPermission');

const router = express.Router();

// Protect all routes using auth middleware
router.use(authMiddlewares.protect);

// Route for getting group subjects based on query parameters and unallocated grade subjects
router.get('/unallocated-grade-subjects', checkPermission("Read", "GroupSubject"), groupSubjectController.getUnallocatedGradeSubjects);
router.get('/:id/copy-status', checkPermission("Read", "GroupSubject"), groupSubjectController.checkGroupSubjectCopyStatus);
router.post('/:id/copy', checkPermission("Create", "GroupSubject"), groupSubjectController.copyGroupSubjectToSections);
router
    .route('/')
    .get(checkPermission("Read", "GroupSubject"), groupSubjectController.getGroupSubjects)
    .post(checkPermission("Create", "GroupSubject"), groupSubjectController.createGroupSubject);

// Route for specific groupSubject by ID for GET, PATCH, and DELETE
router
    .route('/:id')
    .get(checkPermission("Read", "GroupSubject"), groupSubjectController.getGroupSubjectById)
    .patch(checkPermission("Edit", "GroupSubject"), groupSubjectController.updateGroupSubject)
    .delete(checkPermission("Delete", "GroupSubject"), groupSubjectController.deleteGroupSubject);

module.exports = router;
