const express = require('express');
const eventGalleryController = require('../../controllers/users/eventGalleryController');
const authMiddlewares = require('../../middlewares/authMiddlewares');

const router = express.Router();

// Protect all routes
router.use(authMiddlewares.protect);

// Get all event galleries for student
router.get('/', eventGalleryController.getAllStudentEventGalleries);

// Get event gallery by ID for student
router.get('/:id', eventGalleryController.getStudentEventGalleryById);

module.exports = router;
