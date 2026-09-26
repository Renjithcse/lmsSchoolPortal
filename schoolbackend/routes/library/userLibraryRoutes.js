const express = require('express');
const router = express.Router();
const authMiddlewares = require('../../middlewares/authMiddlewares');
const userLibraryController = require('../../controllers/library/userLibraryController');

// All routes require authentication
router.use(authMiddlewares.protect);

// Get current user's issued books
router.get('/my-books', userLibraryController.getMyIssuedBooks);

// Get current user's library history
router.get('/my-history', userLibraryController.getMyLibraryHistory);

// Get current user's library statistics
router.get('/my-stats', userLibraryController.getMyLibraryStats);

// Get available books for browsing
router.get('/available-books', userLibraryController.getAvailableBooks);

// Request book renewal
router.patch('/renew/:bookIssueId', userLibraryController.requestRenewal);

module.exports = router;
