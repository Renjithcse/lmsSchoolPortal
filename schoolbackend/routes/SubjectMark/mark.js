const express = require('express');
const router = express.Router();

// Import sub-routes
const subCategoryRoutes = require('./SubCategory');
const categoryRoutes = require('./Category');
const examRoutes = require('./Exam');
const studentMarkRoutes = require('./markEntry');

// Use sub-routes under specific paths
router.use('/subcategories', subCategoryRoutes);
router.use('/categories', categoryRoutes);
router.use('/exams', examRoutes);
router.use('/student-marks', studentMarkRoutes);

module.exports = router;
