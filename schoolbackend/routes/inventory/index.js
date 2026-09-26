const express = require('express');
const router = express.Router();

// Import sub-routes
const productRoutes = require('./product');
const purchaseRoutes = require('./purchase');
const salesRoutes = require('./sales');
const storeRoutes = require('./store');
const categoryRoutes = require('./category');
const unitRoutes = require('./unitRoutes');
const subCategoryRoutes = require('./subCategory');

// Use sub-routes under specific paths
router.use('/product', productRoutes);
router.use('/purchase', purchaseRoutes);
router.use('/sales', salesRoutes);
router.use('/store', storeRoutes);
router.use('/category', categoryRoutes);
router.use('/unit', unitRoutes);
router.use('/subcategory', subCategoryRoutes);

module.exports = router;
