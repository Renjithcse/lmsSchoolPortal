const express = require('express');
const router = express.Router();
const subjectNotesController = require('../../controllers/admin/subjectNotesController');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const checkPermission = require('../../middlewares/checkPermission');
const { uploadMultiple, uploadMultipleOptional } = require('../../middlewares/s3UploadMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddlewares.protect);

// Subject Notes CRUD routes
router
    .route('/')
    .get(
        checkPermission('Read', 'SubjectNotes'),
        subjectNotesController.getAllSubjectNotes
    )
    .post(
        checkPermission('Create', 'SubjectNotes'),
        uploadMultipleOptional("subject-notes","documents"),
        subjectNotesController.createSubjectNote
    );

// Create multiple subject notes
router
    .route('/batch')
    .post(
        checkPermission('Create', 'SubjectNotes'),
        subjectNotesController.createMultipleSubjectNotes
    );

// Test endpoint
router
    .route('/test')
    .get(subjectNotesController.testSubjectNotes);

// Test S3 upload endpoint
router
    .route('/test-upload')
    .post(
        uploadMultiple('test-uploads', 'test-files', 3),
        (req, res) => {
            res.json({
                status: 'success',
                message: 'S3 upload test successful',
                files: req.uploadedFiles
            });
        }
    );

// Get available subjects for a specific class
router
    .route('/available-subjects')
    .get(
        checkPermission('Read', 'SubjectNotes'),
        subjectNotesController.getAvailableSubjects
    );

// Get subject notes by class and subject
router
    .route('/by-class')
    .get(
        checkPermission('Read', 'SubjectNotes'),
        subjectNotesController.getSubjectNotesByClass
    );

// Get available sections for publishing (must be before /:id routes)
router
    .route('/available-publish-sections')
    .get(
        checkPermission('Read', 'SubjectNotes'),
        subjectNotesController.getAvailablePublishSections
    );

// Publish subject note to multiple sections (must be before /:id routes)
router
    .route('/:noteId/publish')
    .post(
        checkPermission('Edit', 'SubjectNotes'),
        subjectNotesController.publishSubjectNote
    );

// Remove a specific document from a subject note (must be before /:id routes)
router
    .route('/:id/documents/:documentId')
    .delete(
        checkPermission('Edit', 'SubjectNotes'),
        subjectNotesController.removeDocument
    );

// Individual subject note routes (must be last to avoid catching other routes)
router
    .route('/:id')
    .get(
        checkPermission('Read', 'SubjectNotes'),
        subjectNotesController.getSubjectNote
    )
    .patch(
        checkPermission('Edit', 'SubjectNotes'),
        uploadMultipleOptional("subject-notes", "documents"),
        subjectNotesController.updateSubjectNote
    )
    .delete(
        checkPermission('Delete', 'SubjectNotes'),
        subjectNotesController.deleteSubjectNote
    );

module.exports = router;
