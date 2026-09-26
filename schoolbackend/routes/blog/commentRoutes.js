const express = require('express');
const router = express.Router();
const authMiddlewares = require('../../middlewares/authMiddlewares');
const commentController = require('../../controllers/blog/commentController');
const checkPermission = require('../../middlewares/checkPermission');



// Protected routes
router.use(authMiddlewares.protect);

// Public routes (no authentication required)
router.get('/post/:postId', commentController.getComments);

// Comment management routes
router.route('/')
    .post(commentController.createComment);

router.route('/user')
    .get(commentController.getUserComments);

router.route('/:id')
    .put(commentController.updateComment)
    .delete(commentController.deleteComment);

// Admin-only routes
router.patch('/:id/approve', checkPermission("Approve", "Comments"), commentController.approveComment);
router.get('/pending/list', checkPermission("Approve", "Comments"), commentController.getPendingComments);
router.get('/stats/overview', checkPermission("Read", "Blog"), commentController.getCommentStats);

// User interaction routes
router.patch('/:id/like', commentController.toggleCommentLike);

module.exports = router;
