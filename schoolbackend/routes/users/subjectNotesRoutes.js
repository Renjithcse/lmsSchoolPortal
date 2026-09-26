const express = require('express');
const router = express.Router();
const subjectNotesController = require('../../controllers/users/subjectNotesController');
const authMiddlewares = require('../../middlewares/authMiddlewares');

// Apply authentication middleware to all routes
router.use(authMiddlewares.protect);

// Get all subject notes for the authenticated student
router.get('/', subjectNotesController.getStudentSubjectNotes);

// Get student's subjects with notes count
router.get('/subjects', subjectNotesController.getStudentSubjectsWithNotes);

// Get subject notes for a specific subject
router.get('/subject/:subjectId', subjectNotesController.getSubjectNotesBySubject);

// Get a specific subject note (with view tracking)
router.get('/:id', subjectNotesController.getSubjectNote);

// Download a document from subject notes
router.get('/:id/documents/:documentId/download', subjectNotesController.downloadDocument);

module.exports = router;

