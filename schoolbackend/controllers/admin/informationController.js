const Information = require('../../models/Information/Information');
const User = require('../../models/userModel');
const Student = require('../../models/users/Student');
const Teacher = require('../../models/users/Teacher');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const APIFeatures = require('../../utils/apiFeatures');
// File handling is now managed by s3UploadMiddleware
const { deleteS3File } = require('../../middlewares/s3UploadMiddleware');

// File upload is now handled by s3UploadMiddleware

// S3 configuration is handled by s3UploadMiddleware

// Create new information
exports.createInformation = catchAsync(async (req, res, next) => {
    
    const {
        title,
        description,
        category,
        publishTo,
        studentTargeting,
        status,
        priority,
        tags,
        expiryDate,
        scheduledPublishDate
    } = req.body;

    // Parse studentTargeting if it's a string
    let parsedStudentTargeting = studentTargeting;
    if (typeof studentTargeting === 'string') {
        try {
            parsedStudentTargeting = JSON.parse(studentTargeting);
        } catch (error) {
            return next(new AppError('Invalid student targeting data', 400));
        }
    }

    // Process uploaded files from S3 middleware
    const attachments = [];
    console.log('Processing uploaded files from S3 middleware:', req.uploadedFiles);
    
    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
        console.log(`Found ${req.uploadedFiles.length} files uploaded to S3`);
        for (const uploadedFile of req.uploadedFiles) {
            console.log('Processing uploaded file:', uploadedFile);
            attachments.push({
                fileName: uploadedFile.key.split('/').pop(), // Extract filename from key
                originalName: uploadedFile.originalName,
                filePath: uploadedFile.url, // S3 URL
                fileSize: uploadedFile.size,
                mimeType: uploadedFile.mimetype,
                s3Key: uploadedFile.key, // Store S3 key for deletion
                uploadedAt: new Date()
            });
        }
    } else {
        console.log('No files uploaded to S3');
    }

    const informationData = {
        title,
        description,
        category,
        publishTo,
        studentTargeting: parsedStudentTargeting,
        status: status || 'Draft',
        priority: priority || 'Medium',
        attachments,
        createdBy: req.user.id
    };

    // Parse tags if provided
    if (tags) {
        if (typeof tags === 'string') {
            informationData.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        } else if (Array.isArray(tags)) {
            informationData.tags = tags;
        }
    }

    // Set expiry date if provided
    if (expiryDate) {
        informationData.expiryDate = new Date(expiryDate);
    }

    // Set scheduled publish date if provided
    if (scheduledPublishDate) {
        informationData.scheduledPublishDate = new Date(scheduledPublishDate);
    }

    const information = await Information.create(informationData);

    // If published, trigger notification (we'll implement this later)
    if (information.status === 'Published') {
        // TODO: Trigger notification system
        console.log('Information published, notifications should be sent');
    }

    res.status(201).json({
        status: 'success',
        data: {
            information
        }
    });
});

// Get all information with filtering and pagination
exports.getAllInformation = catchAsync(async (req, res, next) => {
    // Build filter object manually
    const queryObj = { ...req.query };
    const excludedFields = ["page", "sort", "limit", "fields", "keyword"];
    excludedFields.forEach((el) => delete queryObj[el]);
    Object.keys(queryObj).forEach(
        (el) => queryObj[el] === "" && delete queryObj[el]
    );

    // Handle search functionality
    if (req.query.search && req.query.search.trim()) {
        const searchRegex = new RegExp(req.query.search.trim(), 'i');
        queryObj.$or = [
            { title: searchRegex },
            { description: searchRegex },
            { tags: { $in: [searchRegex] } }
        ];
        delete queryObj.search;
    }

    let query = Information.find(queryObj).populate('createdBy', 'name email');

    const features = new APIFeatures(query, req.query)
        .sort()
        .limitFields()
        .paginate();

    const information = await features.query;
    const total = await Information.countDocuments(queryObj);

    res.status(200).json({
        status: 'success',
        results: information.length,
        total,
        data: {
            information
        }
    });
});

// Get single information by ID
exports.getInformation = catchAsync(async (req, res, next) => {
    const information = await Information.findById(req.params.id)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

    if (!information) {
        return next(new AppError('Information not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            information
        }
    });
});

// Update information
exports.updateInformation = catchAsync(async (req, res, next) => {
    console.log('=== UPDATE INFORMATION DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Request file keys:', Object.keys(req.files || {}));
    console.log('Existing attachments from body:', req.body.existingAttachments);
    
    const {
        title,
        description,
        category,
        publishTo,
        studentTargeting,
        status,
        priority,
        tags,
        expiryDate,
        scheduledPublishDate
    } = req.body;

    const information = await Information.findById(req.params.id);
    if (!information) {
        return next(new AppError('Information not found', 404));
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

    // Handle existing attachments (from frontend)
    // Always process existingAttachments, even if empty array (to handle removal of all attachments)
    if (req.body.existingAttachments !== undefined) {
        try {
            const existingAttachments = JSON.parse(req.body.existingAttachments);
            information.attachments = existingAttachments; // This can be an empty array
            console.log('Updated attachments with existing attachments:', existingAttachments);
        } catch (error) {
            console.error('Error parsing existing attachments:', error);
            // If parsing fails, keep existing attachments
        }
    }

    // Process new uploaded files from S3 middleware
    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
        console.log(`Found ${req.uploadedFiles.length} new files uploaded to S3`);
        for (const uploadedFile of req.uploadedFiles) {
            console.log('Processing new uploaded file:', uploadedFile);
            const newAttachment = {
                fileName: uploadedFile.key.split('/').pop(), // Extract filename from key
                originalName: uploadedFile.originalName,
                filePath: uploadedFile.url, // S3 URL
                fileSize: uploadedFile.size,
                mimeType: uploadedFile.mimetype,
                s3Key: uploadedFile.key, // Store S3 key for deletion
                uploadedAt: new Date()
            };
            information.attachments.push(newAttachment);
        }
    }

    // Update fields
    if (title !== undefined) information.title = title;
    if (description !== undefined) information.description = description;
    if (category !== undefined) information.category = category;
    if (publishTo !== undefined) information.publishTo = publishTo;
    if (parsedStudentTargeting !== undefined) information.studentTargeting = parsedStudentTargeting;
    if (priority !== undefined) information.priority = priority;
    if (expiryDate !== undefined) information.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (scheduledPublishDate !== undefined) {
        information.scheduledPublishDate = scheduledPublishDate ? new Date(scheduledPublishDate) : null;
    }
    
    // Handle tags
    if (tags !== undefined) {
        if (typeof tags === 'string') {
            information.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        } else if (Array.isArray(tags)) {
            information.tags = tags;
        }
    }

    // Track status change for notifications
    const wasPublished = information.status === 'Published';
    if (status !== undefined) information.status = status;
    
    information.updatedBy = req.user.id;

    await information.save();

    // If newly published, trigger notification
    if (!wasPublished && information.status === 'Published') {
        // TODO: Trigger notification system
        console.log('Information newly published, notifications should be sent');
    }

    res.status(200).json({
        status: 'success',
        data: {
            information
        }
    });
});

// Delete information
exports.deleteInformation = catchAsync(async (req, res, next) => {
    const information = await Information.findById(req.params.id);
    if (!information) {
        return next(new AppError('Information not found', 404));
    }

    // Delete associated files from S3
    if (information.attachments && information.attachments.length > 0) {
        for (const attachment of information.attachments) {
            try {
                if (attachment.s3Key) {
                    await deleteS3File(attachment.s3Key);
                    console.log(`Successfully deleted S3 file: ${attachment.s3Key}`);
                } else {
                    // Fallback for old files without S3 key
                    console.log('No S3 key found for attachment, skipping deletion');
                }
            } catch (error) {
                console.error('Error deleting S3 file:', error);
                // Continue with deletion even if S3 deletion fails
            }
        }
    }

    await Information.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Remove specific attachment
exports.removeAttachment = catchAsync(async (req, res, next) => {
    const { id, attachmentId } = req.params;
    
    const information = await Information.findById(id);
    if (!information) {
        return next(new AppError('Information not found', 404));
    }

    const attachmentIndex = information.attachments.findIndex(
        att => att._id.toString() === attachmentId
    );

    if (attachmentIndex === -1) {
        return next(new AppError('Attachment not found', 404));
    }

    const attachment = information.attachments[attachmentIndex];

    // Delete file from S3
    try {
        if (attachment.s3Key) {
            await deleteS3File(attachment.s3Key);
            console.log(`Successfully deleted S3 file: ${attachment.s3Key}`);
        } else {
            console.log('No S3 key found for attachment, skipping deletion');
        }
    } catch (error) {
        console.error('Error deleting S3 file:', error);
        // Continue with removal even if S3 deletion fails
    }

    // Remove from array
    information.attachments.splice(attachmentIndex, 1);
    information.updatedBy = req.user.id;
    await information.save();

    res.status(200).json({
        status: 'success',
        message: 'Attachment removed successfully'
    });
});

// Get information by category
exports.getInformationByCategory = catchAsync(async (req, res, next) => {
    const { category } = req.params;
    
    const validCategories = ['Information Desk', 'Help Desk', 'General Information'];
    if (!validCategories.includes(category)) {
        return next(new AppError('Invalid category', 400));
    }

    // Build filter object manually
    const queryObj = { ...req.query };
    const excludedFields = ["page", "sort", "limit", "fields", "keyword"];
    excludedFields.forEach((el) => delete queryObj[el]);
    Object.keys(queryObj).forEach(
        (el) => queryObj[el] === "" && delete queryObj[el]
    );

    // Add category and status filters
    queryObj.category = category;
    queryObj.status = 'Published';

    let query = Information.find(queryObj).populate('createdBy', 'name email');

    const features = new APIFeatures(query, req.query)
        .sort()
        .limitFields()
        .paginate();

    const information = await features.query;
    const total = await Information.countDocuments(queryObj);

    res.status(200).json({
        status: 'success',
        results: information.length,
        total,
        data: {
            information
        }
    });
});

// Get target audience count
exports.getTargetAudienceCount = catchAsync(async (req, res, next) => {
    const { publishTo, studentTargeting } = req.body;

    let parsedStudentTargeting = studentTargeting;
    if (typeof studentTargeting === 'string') {
        try {
            parsedStudentTargeting = JSON.parse(studentTargeting);
        } catch (error) {
            return next(new AppError('Invalid student targeting data', 400));
        }
    }

    // Create a temporary information object to use the method
    const tempInfo = new Information({
        title: 'temp',
        description: 'temp',
        publishTo,
        studentTargeting: parsedStudentTargeting
    });

    const queries = await tempInfo.getTargetAudienceQuery();
    let totalCount = 0;

    if (Array.isArray(queries)) {
        // Both teachers and students
        for (const queryObj of queries) {
            if (queryObj.model === 'Teacher') {
                const count = await Teacher.countDocuments(queryObj.query);
                totalCount += count;
            } else if (queryObj.model === 'Student') {
                const count = await Student.countDocuments(queryObj.query);
                totalCount += count;
            }
        }
    } else {
        // Single query
        if (queries.model === 'Student') {
            totalCount = await Student.countDocuments(queries.query);
        } else if (queries.model === 'Teacher') {
            totalCount = await Teacher.countDocuments(queries.query);
        }
    }

    res.status(200).json({
        status: 'success',
        data: {
            targetCount: totalCount,
            publishTo,
            studentTargeting: parsedStudentTargeting
        }
    });
});

// Publish information (change status to published)
exports.publishInformation = catchAsync(async (req, res, next) => {
    const information = await Information.findById(req.params.id);
    if (!information) {
        return next(new AppError('Information not found', 404));
    }

    const wasPublished = information.status === 'Published';
    information.status = 'Published';
    information.updatedBy = req.user.id;

    if (!information.publishedAt) {
        information.publishedAt = new Date();
    }

    await information.save();

    // Trigger notification if newly published
    if (!wasPublished) {
        // TODO: Implement notification system
        console.log('Information published, sending notifications to target audience');
    }

    res.status(200).json({
        status: 'success',
        message: 'Information published successfully',
        data: {
            information
        }
    });
});

// Archive information
exports.archiveInformation = catchAsync(async (req, res, next) => {
    const information = await Information.findById(req.params.id);
    if (!information) {
        return next(new AppError('Information not found', 404));
    }

    information.status = 'Archived';
    information.updatedBy = req.user.id;
    await information.save();

    res.status(200).json({
        status: 'success',
        message: 'Information archived successfully',
        data: {
            information
        }
    });
});

// Get dashboard statistics
exports.getInformationStats = catchAsync(async (req, res, next) => {
    const stats = await Information.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                published: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'Published'] }, 1, 0]
                    }
                },
                draft: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'Draft'] }, 1, 0]
                    }
                },
                archived: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'Archived'] }, 1, 0]
                    }
                }
            }
        }
    ]);

    const categoryStats = await Information.aggregate([
        {
            $match: { status: 'Published' }
        },
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 }
            }
        }
    ]);

    const priorityStats = await Information.aggregate([
        {
            $match: { status: 'Published' }
        },
        {
            $group: {
                _id: '$priority',
                count: { $sum: 1 }
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            overview: stats[0] || { total: 0, published: 0, draft: 0, archived: 0 },
            byCategory: categoryStats,
            byPriority: priorityStats
        }
    });
});
