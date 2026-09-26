const express = require('express');
const router = express.Router();

const rackRoutes = require('./rackRoutes');
const bookRoutes = require('./bookRoutes');
const bookCatalogRoutes = require('./bookCatalogRoutes');
const bookIssueRoutes = require('./bookIssueRoutes');
const userLibraryRoutes = require('./userLibraryRoutes');
const categoryRoutes = require('./categoryRoutes');

// Mount library routes
router.use('/racks', rackRoutes);
router.use('/books', bookRoutes);
router.use('/catalogs', bookCatalogRoutes);
router.use('/issues', bookIssueRoutes);
router.use('/user', userLibraryRoutes);
router.use('/categories', categoryRoutes);

module.exports = router;
