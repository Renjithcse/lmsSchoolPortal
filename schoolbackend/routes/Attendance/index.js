const express = require('express');
const router = express.Router();

const attendanceRoutes = require('./attendanceRoutes');

// Mount attendance routes directly (no additional prefix since it's already mounted at /api/v1/attendance)
router.use('/', attendanceRoutes);

module.exports = router;
