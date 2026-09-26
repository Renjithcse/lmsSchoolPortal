const express = require('express');
const router = express.Router();

const postRoutes = require('./postRoutes');
const commentRoutes = require('./commentRoutes');

router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);

module.exports = router;
