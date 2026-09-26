const express = require('express');
const router = express.Router();
const authMiddlewares = require('../../middlewares/authMiddlewares');
const bookController = require('../../controllers/library/bookController');
const checkPermission = require('../../middlewares/checkPermission');

// Routes for all books (GET, POST)
router.route('/')
  .get(authMiddlewares.protect, bookController.getBooks)
  .post(authMiddlewares.protect, checkPermission("Create", "Book"), bookController.createBook);

// Routes for specific book by ID (GET, PUT, DELETE)
router.route('/:id')
  .get(authMiddlewares.protect, checkPermission("Read", "Book"), bookController.getBookById)
  .put(authMiddlewares.protect, checkPermission("Edit", "Book"), bookController.updateBook)
  .delete(authMiddlewares.protect, checkPermission("Delete", "Book"), bookController.deleteBook);

// Get book by ISBN
router.get('/isbn/:isbn', authMiddlewares.protect, checkPermission("Read", "Book"), bookController.getBookByISBN);

// Get available positions in a rack
router.get('/positions/available', authMiddlewares.protect, checkPermission("Read", "Book"), bookController.getAvailablePositions);

// Get book statistics
router.get('/stats/overview', authMiddlewares.protect, checkPermission("Read", "Book"), bookController.getBookStats);

module.exports = router;
