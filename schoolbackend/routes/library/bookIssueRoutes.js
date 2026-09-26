const express = require('express');
const router = express.Router();
const authMiddlewares = require('../../middlewares/authMiddlewares');
const bookIssueController = require('../../controllers/library/bookIssueController');
const checkPermission = require('../../middlewares/checkPermission');

// Issue a book
router.post('/issue', authMiddlewares.protect, checkPermission("Create", "LibraryBookIssue"), bookIssueController.issueBook);

// Return a book
router.post('/return', authMiddlewares.protect, checkPermission("Edit", "LibraryBookIssue"), bookIssueController.returnBook);

// Renew a book
router.patch('/:bookIssueId/renew', authMiddlewares.protect, checkPermission("Edit", "LibraryBookIssue"), bookIssueController.renewBook);

// Pay fine
router.patch('/:bookIssueId/pay-fine', authMiddlewares.protect, checkPermission("Edit", "LibraryBookIssue"), bookIssueController.payFine);

// Get all book issues with filtering
router.get('/', authMiddlewares.protect, checkPermission("Read", "LibraryBookIssue"), bookIssueController.getBookIssues);

// Get specific book issue by ID
router.get('/:id', authMiddlewares.protect, checkPermission("Read", "LibraryBookIssue"), bookIssueController.getBookIssueById);

// Get user's issued books
router.get('/user/:userType/:userId', authMiddlewares.protect, checkPermission("Read", "LibraryBookIssue"), bookIssueController.getUserIssuedBooks);

// Get overdue books
router.get('/overdue/list', authMiddlewares.protect, checkPermission("Read", "LibraryBookIssue"), bookIssueController.getOverdueBooks);

// Get library statistics
router.get('/stats/overview', authMiddlewares.protect, checkPermission("Read", "LibraryBookIssue"), bookIssueController.getLibraryStats);

// Get all teachers' issued books
router.get('/teachers/books', authMiddlewares.protect, checkPermission("Read", "LibraryMyBooks"), bookIssueController.getTeachersIssuedBooks);

module.exports = router;
