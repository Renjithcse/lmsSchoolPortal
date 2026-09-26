const express = require('express');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const checkPermission = require('../../middlewares/checkPermission');
const eventGalleryController = require('../../controllers/admin/eventGalleryController');

const router = express.Router();

// Protect all routes
router.use(authMiddlewares.protect);

router
	.route('/')
	.post(checkPermission('Create', 'EventGallery'), eventGalleryController.createEventGallery)
	.get(checkPermission('Read', 'EventGallery'), eventGalleryController.getAllEventGalleries);

router
	.route('/:id')
	.get(checkPermission('Read', 'EventGallery'), eventGalleryController.getEventGalleryById)
	.patch(checkPermission('Edit', 'EventGallery'), eventGalleryController.updateEventGallery)
	.delete(checkPermission('Delete', 'EventGallery'), eventGalleryController.deleteEventGallery);

router
	.route('/:id/publish')
	.patch(checkPermission('Edit', 'EventGallery'), eventGalleryController.publishEventGallery);

router
	.route('/:id/unpublish')
	.patch(checkPermission('Edit', 'EventGallery'), eventGalleryController.unpublishEventGallery);

module.exports = router;
