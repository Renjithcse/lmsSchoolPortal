const express = require('express');
const router = express.Router();
const authMiddlewares = require('../../middlewares/authMiddlewares');
const bookCatalogController = require('../../controllers/library/bookCatalogController');
const checkPermission = require('../../middlewares/checkPermission');

// All routes require authentication
router.use(authMiddlewares.protect);

// Get all book catalogs
router.get('/', checkPermission("Read", "LibraryBookCatalog"), bookCatalogController.getBookCatalogs);

// Get book catalog by ID
router.get('/:id', checkPermission("Read", "LibraryBookCatalog"), bookCatalogController.getBookCatalogById);

// Get book catalog by ISBN
router.get('/isbn/:isbn', checkPermission("Read", "LibraryBookCatalog"), bookCatalogController.getBookCatalogByISBN);

// Create new book catalog
router.post('/', checkPermission("Create", "LibraryBookCatalog"), bookCatalogController.createBookCatalog);

// Update book catalog
router.put('/:id', checkPermission("Update", "LibraryBookCatalog"), bookCatalogController.updateBookCatalog);

// Delete book catalog
router.delete('/:id', checkPermission("Delete", "LibraryBookCatalog"), bookCatalogController.deleteBookCatalog);

module.exports = router;
