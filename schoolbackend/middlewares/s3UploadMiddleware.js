const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const s3 = require('../utils/s3Client');

// File validation function
const validateFile = (file) => {
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedDocTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv'
    ];

    const allowedTypes = [...allowedImageTypes, ...allowedDocTypes];

    if (!allowedTypes.includes(file.mimetype)) {
        throw new Error(`File type ${file.mimetype} is not allowed`);
    }

    // File size limits (in bytes)
    const maxSize = allowedImageTypes.includes(file.mimetype) ? 5 * 1024 * 1024 : 20 * 1024 * 1024; // 5MB for images, 20MB for documents

    if (file.size > maxSize) {
        throw new Error(`File size exceeds limit of ${maxSize / (1024 * 1024)}MB`);
    }
};

// Generate unique filename
const generateUniqueFilename = (originalname) => {
    const ext = path.extname(originalname);
    const name = path.basename(originalname, ext);
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(6).toString('hex');
    return `${name}-${timestamp}-${randomString}${ext}`;
};

// Upload file to S3
const uploadToS3 = async (file, folder) => {
    try {
        const uniqueFilename = generateUniqueFilename(file.originalname);
        const key = `${folder}/${uniqueFilename}`;

    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
      // ACL removed - bucket should have public read policy instead
    };

        const result = await s3.upload(uploadParams).promise();

        return {
            url: result.Location,
            key: key,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype
        };
    } catch (error) {
        throw new Error(`S3 upload failed: ${error.message}`);
    }
};

// Single file upload middleware
const uploadSingle = (folder, fieldName = 'file') => {
    return async (req, res, next) => {
        try {
            // Configure multer for memory storage
            const storage = multer.memoryStorage();
            const upload = multer({
                storage: storage,
                limits: {
                    fileSize: 20 * 1024 * 1024 // 20MB max
                }
            }).single(fieldName);

            upload(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({
                        status: 'error',
                        message: err.message
                    });
                }

                if (!req.file) {
                    return res.status(400).json({
                        status: 'error',
                        message: `No ${fieldName} file uploaded`
                    });
                }

                try {
                    // Validate file
                    validateFile(req.file);

                    // Upload to S3
                    const uploadedFile = await uploadToS3(req.file, folder);

                    // Attach to request object
                    req.uploadedFile = uploadedFile;

                    next();
                } catch (error) {
                    return res.status(400).json({
                        status: 'error',
                        message: error.message
                    });
                }
            });
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Upload middleware error: ' + error.message
            });
        }
    };
};

const uploadSingleOptional = (folder, fieldName = 'file') => {
    return async (req, res, next) => {
        try {
            const storage = multer.memoryStorage();
            const upload = multer({
                storage,
                limits: {
                    fileSize: 20 * 1024 * 1024 // 20MB max
                }
            }).single(fieldName);

            upload(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({
                        status: 'error',
                        message: err.message
                    });
                }

                if (!req.file) {
                    req.uploadedFile = null;
                    return next();
                }

                try {
                    validateFile(req.file);

                    const uploadedFile = await uploadToS3(req.file, folder);
                    req.uploadedFile = uploadedFile;

                    next();
                } catch (error) {
                    return res.status(400).json({
                        status: 'error',
                        message: error.message
                    });
                }
            });
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Upload middleware error: ' + error.message
            });
        }
    };
};

// Multiple files upload middleware
const uploadMultiple = (folder, fieldName = 'files', maxFiles = 10) => {
    return async (req, res, next) => {
        try {
            // Configure multer for memory storage
            const storage = multer.memoryStorage();
            const upload = multer({
                storage: storage,
                limits: {
                    fileSize: 20 * 1024 * 1024, // 20MB max per file
                    files: maxFiles
                }
            }).array(fieldName, maxFiles);

            upload(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({
                        status: 'error',
                        message: err.message
                    });
                }

                if (!req.files || req.files.length === 0) {
                    return res.status(400).json({
                        status: 'error',
                        message: `No ${fieldName} files uploaded`
                    });
                }

                try {
                    const uploadedFiles = [];

                    // Process each file
                    for (const file of req.files) {
                        // Validate file
                        validateFile(file);

                        // Upload to S3
                        const uploadedFile = await uploadToS3(file, folder);
                        uploadedFiles.push(uploadedFile);
                    }

                    // Attach to request object
                    req.uploadedFiles = uploadedFiles;

                    next();
                } catch (error) {
                    return res.status(400).json({
                        status: 'error',
                        message: error.message
                    });
                }
            });
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Upload middleware error: ' + error.message
            });
        }
    };
};

// Optional multiple file upload middleware (for updates where files are optional)
const uploadMultipleOptional = (folder, fieldName = 'files', maxFiles = 10) => {
    return async (req, res, next) => {
        try {
            // Configure multer for memory storage
            const storage = multer.memoryStorage();
            const upload = multer({
                storage: storage,
                limits: {
                    fileSize: 20 * 1024 * 1024, // 20MB max per file
                    files: maxFiles
                }
            }).array(fieldName, maxFiles);

            upload(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({
                        status: 'error',
                        message: err.message
                    });
                }

                // No files uploaded - that's okay for optional uploads
                if (!req.files || req.files.length === 0) {
                    req.uploadedFiles = []; // Empty array
                    return next();
                }

                try {
                    const uploadedFiles = [];

                    // Process each file
                    for (const file of req.files) {
                        // Validate file
                        validateFile(file);

                        // Upload to S3
                        const uploadedFile = await uploadToS3(file, folder);
                        uploadedFiles.push(uploadedFile);
                    }

                    // Attach to request object
                    req.uploadedFiles = uploadedFiles;

                    next();
                } catch (error) {
                    return res.status(400).json({
                        status: 'error',
                        message: error.message
                    });
                }
            });
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Upload middleware error: ' + error.message
            });
        }
    };
};

const uploadAssignmentAttachments = ({
    questionField = 'questionFile',
    questionFolder = 'assignments/question',
    supportingField = 'supportingDocuments',
    supportingFolder = 'assignments/supporting',
    maxSupportingFiles = 5,
}) => {
    return async (req, res, next) => {
        try {
            const storage = multer.memoryStorage();
            const upload = multer({
                storage,
                limits: {
                    fileSize: 20 * 1024 * 1024,
                },
            }).fields([
                { name: questionField, maxCount: 1 },
                { name: supportingField, maxCount: maxSupportingFiles },
            ]);

            upload(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({
                        status: 'error',
                        message: err.message,
                    });
                }

                try {
                    const questionFiles = req.files?.[questionField] || [];
                    const supportingFiles = req.files?.[supportingField] || [];

                    if (questionFiles.length > 0) {
                        const questionFile = questionFiles[0];
                        validateFile(questionFile);
                        const uploadedQuestion = await uploadToS3(questionFile, questionFolder);
                        req.uploadedFile = uploadedQuestion;
                    } else {
                        req.uploadedFile = null;
                    }

                    const uploadedSupporting = [];
                    for (const file of supportingFiles) {
                        validateFile(file);
                        const uploaded = await uploadToS3(file, supportingFolder);
                        uploadedSupporting.push(uploaded);
                    }
                    req.uploadedFiles = uploadedSupporting;

                    next();
                } catch (error) {
                    return res.status(400).json({
                        status: 'error',
                        message: error.message,
                    });
                }
            });
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Upload middleware error: ' + error.message,
            });
        }
    };
};

// Delete file from S3
const deleteS3File = async (fileKey) => {
    try {
        const deleteParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileKey
        };

        await s3.deleteObject(deleteParams).promise();
        return true;
    } catch (error) {
        throw new Error(`Failed to delete file: ${error.message}`);
    }
};

// Generate pre-signed URL for private file access
const generatePresignedUrl = (fileKey, expiration = 3600) => {
    try {
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileKey,
            Expires: expiration // URL expires in seconds
        };

        return s3.getSignedUrl('getObject', params);
    } catch (error) {
        throw new Error(`Failed to generate pre-signed URL: ${error.message}`);
    }
};

// Get file information from S3
const getS3FileInfo = async (fileKey) => {
    try {
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileKey
        };

        const result = await s3.headObject(params).promise();

        return {
            size: result.ContentLength,
            lastModified: result.LastModified,
            contentType: result.ContentType,
            etag: result.ETag
        };
    } catch (error) {
        throw new Error(`Failed to get file info: ${error.message}`);
    }
};


module.exports = {
    uploadSingle,
    uploadSingleOptional,
    uploadMultiple,
    uploadMultipleOptional,
    uploadAssignmentAttachments,
    deleteS3File,
    generatePresignedUrl,
    getS3FileInfo,
    uploadToS3
};
