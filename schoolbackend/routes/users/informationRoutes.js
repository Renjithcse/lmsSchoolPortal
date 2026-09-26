const express = require('express');
const informationController = require('../../controllers/users/informationController');
const authMiddlewares = require('../../middlewares/authMiddlewares');

const router = express.Router();

// Protect all routes
router.use(authMiddlewares.protect);

// Get all information for student
router.get('/', informationController.getAllStudentInformation);

// Get information by category
router.get('/category/:category', informationController.getStudentInformationByCategory);

// Get categories with counts
router.get('/categories/overview', informationController.getStudentInformationCategories);

// Get recent information for dashboard
router.get('/recent', informationController.getRecentStudentInformation);

// Get unread count
router.get('/unread/count', informationController.getUnreadInformationCount);

// Search information
router.get('/search', informationController.searchStudentInformation);

// Get single information item
router.get('/:id', informationController.getStudentInformation);

// Download attachment
router.get('/:id/attachments/:attachmentId/download', informationController.downloadAttachment);

module.exports = router;
