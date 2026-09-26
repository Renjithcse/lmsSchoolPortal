const express = require('express');
const router = express.Router();
const authMiddlewares = require('../../middlewares/authMiddlewares');
const postController = require('../../controllers/blog/postController');
const checkPermission = require('../../middlewares/checkPermission');

// Public routes (no authentication required)
router.get('/published', postController.getPublishedPosts);
router.get('/featured', postController.getFeaturedPosts);
router.get('/category/:category', postController.getPostsByCategory);
router.get('/slug/:slug', postController.getPostBySlug);
router.patch('/:id/view', postController.incrementViewCount);

// Protected routes
router.use(authMiddlewares.protect);

// Post management routes
router.route('/')
    .get(postController.getPosts)
    .post(checkPermission("Create", "Post"), postController.createPost);

router.route('/:id')
    .get(postController.getPost)
    .put(checkPermission("Edit", "Post"), postController.updatePost)
    .delete(checkPermission("Delete", "Post"), postController.deletePost);

// Admin-only routes
router.patch('/:id/approve', checkPermission("Edit", "Post"), postController.approvePost);
router.get('/stats/overview', checkPermission("Read", "Blog"), postController.getBlogStats);

// User interaction routes
router.patch('/:id/like', postController.toggleLike);

module.exports = router;
