const express = require('express');
const router = express.Router();
const chapterController = require('../../controllers/admin/chapterController');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const checkPermission = require('../../middlewares/checkPermission');

// Apply authentication middleware to all routes
router.use(authMiddlewares.protect);

// Chapter CRUD routes
router
    .route('/')
    .get(
        checkPermission('Read', 'LessonPlans'),
        chapterController.getAllChapters
    )
    .post(
        checkPermission('Create', 'LessonPlans'),
        chapterController.createChapter
    );

// Get available subjects for chapters based on grade
router
    .route('/available-subjects')
    .get(
        checkPermission('Read', 'LessonPlans'),
        chapterController.getAvailableSubjects
    );

// Get available sections for publishing (must be before /:id routes)
router
    .route('/available-publish-sections')
    .get(
        checkPermission('Read', 'LessonPlans'),
        chapterController.getAvailablePublishSections
    );

// Publish chapter to multiple sections (must be before /:id routes)
router
    .route('/:chapterId/publish')
    .post(
        checkPermission('Edit', 'LessonPlans'),
        chapterController.publishChapter
    );

// Individual chapter routes (must be last to avoid catching other routes)
router
    .route('/:id')
    .get(
        checkPermission('Read', 'LessonPlans'),
        chapterController.getChapter
    )
    .patch(
        checkPermission('Edit', 'LessonPlans'),
        chapterController.updateChapter
    )
    .delete(
        checkPermission('Delete', 'LessonPlans'),
        chapterController.deleteChapter
    );

module.exports = router;
