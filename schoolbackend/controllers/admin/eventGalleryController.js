const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const EventGallery = require('../../models/Admin/EventGallery');
const {
	uploadEventGalleryImageToS3,
	deleteEventGalleryS3File,
	extractS3KeyFromUrl,
} = require('../../utils/eventGalleryS3Helper');

// Create event gallery
exports.createEventGallery = catchAsync(async (req, res, next) => {
	const { eventName, description, eventDate, images, publishOption, scheduledPublishDate } = req.body;

	if (!eventName  || !eventDate) {
		return next(new AppError('eventName, description and eventDate are required', 400));
	}

	if (!images || !Array.isArray(images) || images.length === 0) {
		return next(new AppError('At least one image is required', 400));
	}

	// Upload images to S3
	const uploadedImages = [];
	for (const image of images) {
		if (image && image.includes('data:image')) {
			try {
				const imageData = await uploadEventGalleryImageToS3(image, 'event-gallery');
				uploadedImages.push({
					url: imageData.url,
					s3Key: imageData.key,
				});
			} catch (error) {
				return next(new AppError(`Failed to upload image: ${error.message}`, 400));
			}
		}
	}

	if (uploadedImages.length === 0) {
		return next(new AppError('No valid images provided', 400));
	}

	// Determine status based on publish option
	let status = 'Draft';
	if (publishOption === 'Publish Now') {
		status = 'Published';
	} else if (publishOption === 'Publish Later' && scheduledPublishDate) {
		status = 'Draft'; // Will be published automatically when scheduled date arrives
	}

	const eventGallery = await EventGallery.create({
		eventName,
		description,
		eventDate: new Date(eventDate),
		images: uploadedImages,
		status,
		publishOption: publishOption || 'Publish Now',
		scheduledPublishDate: scheduledPublishDate ? new Date(scheduledPublishDate) : undefined,
		createdBy: req.user._id,
		updatedBy: req.user._id,
	});

	res.status(201).json({
		status: 'success',
		data: eventGallery,
	});
});

// Get all event galleries
exports.getAllEventGalleries = catchAsync(async (req, res, next) => {
	const eventGalleries = await EventGallery.find()
		.populate('createdBy', 'name email')
		.populate('updatedBy', 'name email')
		.sort({ eventDate: -1, createdAt: -1 })
		.lean();

	res.status(200).json({
		status: 'success',
		results: eventGalleries.length,
		data: eventGalleries,
	});
});

// Get event gallery by ID
exports.getEventGalleryById = catchAsync(async (req, res, next) => {
	const eventGallery = await EventGallery.findById(req.params.id)
		.populate('createdBy', 'name email')
		.populate('updatedBy', 'name email')
		.lean();

	if (!eventGallery) {
		return next(new AppError('Event gallery not found', 404));
	}

	res.status(200).json({
		status: 'success',
		data: eventGallery,
	});
});

// Update event gallery
exports.updateEventGallery = catchAsync(async (req, res, next) => {
	const { eventName, description, eventDate, images, publishOption, scheduledPublishDate } = req.body;

	const eventGallery = await EventGallery.findById(req.params.id);
	if (!eventGallery) {
		return next(new AppError('Event gallery not found', 404));
	}

	// Handle image updates
	let imagesToKeep = [];
	let imagesToDelete = [];

	if (images && Array.isArray(images)) {
		// Separate existing images (URLs) from new images (base64)
		const existingImages = images.filter((img) => !img.includes('data:image') && typeof img === 'string');
		const newImages = images.filter((img) => img && img.includes('data:image'));

		// Keep existing images that are still in the array
		imagesToKeep = eventGallery.images.filter((img) => existingImages.includes(img.url));

		// Find images to delete (removed from the array)
		imagesToDelete = eventGallery.images.filter((img) => !existingImages.includes(img.url));

		// Upload new images
		for (const image of newImages) {
			try {
				const imageData = await uploadEventGalleryImageToS3(image, 'event-gallery');
				imagesToKeep.push({
					url: imageData.url,
					s3Key: imageData.key,
				});
			} catch (error) {
				return next(new AppError(`Failed to upload image: ${error.message}`, 400));
			}
		}
	} else {
		// If no images array provided, keep existing images
		imagesToKeep = eventGallery.images;
	}

	// Delete removed images from S3
	for (const img of imagesToDelete) {
		try {
			await deleteEventGalleryS3File(img.s3Key);
		} catch (error) {
			console.error(`Failed to delete S3 file ${img.s3Key}:`, error);
		}
	}

	// Determine status based on publish option
	let status = eventGallery.status; // Keep existing status by default
	if (publishOption === 'Publish Now') {
		status = 'Published';
	} else if (publishOption === 'Publish Later' && scheduledPublishDate) {
		status = 'Draft'; // Will be published automatically when scheduled date arrives
	}

	// Update event gallery
	const updated = await EventGallery.findByIdAndUpdate(
		req.params.id,
		{
			...(eventName && { eventName }),
			...(description && { description }),
			...(eventDate && { eventDate: new Date(eventDate) }),
			...(images && { images: imagesToKeep }),
			...(publishOption && { publishOption }),
			...(scheduledPublishDate && { scheduledPublishDate: new Date(scheduledPublishDate) }),
			...(publishOption && { status }),
			updatedBy: req.user._id,
		},
		{ new: true, runValidators: true }
	)
		.populate('createdBy', 'name email')
		.populate('updatedBy', 'name email');

	res.status(200).json({
		status: 'success',
		data: updated,
	});
});

// Delete event gallery
exports.deleteEventGallery = catchAsync(async (req, res, next) => {
	const eventGallery = await EventGallery.findById(req.params.id);
	if (!eventGallery) {
		return next(new AppError('Event gallery not found', 404));
	}

	// Delete all images from S3
	for (const img of eventGallery.images) {
		try {
			await deleteEventGalleryS3File(img.s3Key);
		} catch (error) {
			console.error(`Failed to delete S3 file ${img.s3Key}:`, error);
		}
	}

	await EventGallery.findByIdAndDelete(req.params.id);

	res.status(200).json({
		status: 'success',
		data: null,
	});
});

// Publish event gallery
exports.publishEventGallery = catchAsync(async (req, res, next) => {
	const { publishTo, studentTargeting } = req.body;
	const eventGallery = await EventGallery.findById(req.params.id);
	if (!eventGallery) {
		return next(new AppError('Event gallery not found', 404));
	}

	// Parse studentTargeting if it's a string
	let parsedStudentTargeting = studentTargeting;
	if (typeof studentTargeting === 'string') {
		try {
			parsedStudentTargeting = JSON.parse(studentTargeting);
		} catch (error) {
			return next(new AppError('Invalid student targeting data', 400));
		}
	}

	const updateData = {
		status: 'Published',
		updatedBy: req.user._id,
	};

	// Add publishTo and studentTargeting if provided
	if (publishTo) {
		updateData.publishTo = publishTo;
	}
	if (parsedStudentTargeting) {
		updateData.studentTargeting = parsedStudentTargeting;
	}

	const updated = await EventGallery.findByIdAndUpdate(
		req.params.id,
		updateData,
		{ new: true, runValidators: true }
	)
		.populate('createdBy', 'name email')
		.populate('updatedBy', 'name email');

	res.status(200).json({
		status: 'success',
		data: updated,
	});
});

// Unpublish event gallery (set to Draft)
exports.unpublishEventGallery = catchAsync(async (req, res, next) => {
	const eventGallery = await EventGallery.findById(req.params.id);
	if (!eventGallery) {
		return next(new AppError('Event gallery not found', 404));
	}

	const updated = await EventGallery.findByIdAndUpdate(
		req.params.id,
		{
			status: 'Draft',
			updatedBy: req.user._id,
		},
		{ new: true, runValidators: true }
	)
		.populate('createdBy', 'name email')
		.populate('updatedBy', 'name email');

	res.status(200).json({
		status: 'success',
		data: updated,
	});
});
