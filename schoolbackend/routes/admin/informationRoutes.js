const express = require('express');
const informationController = require('../../controllers/admin/informationController');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const checkPermission = require('../../middlewares/checkPermission');
const { uploadMultiple, uploadMultipleOptional } = require('../../middlewares/s3UploadMiddleware');

const router = express.Router();

// Protect all routes
router.use(authMiddlewares.protect);

// S3 configuration testing is handled by s3UploadMiddleware

// Information CRUD routes
router
    .route('/')
    .get(
        checkPermission('Read', 'Information'),
        informationController.getAllInformation
    )
    .post(
        checkPermission('Create', 'Information'),
        uploadMultipleOptional('information', 'attachments'),
        informationController.createInformation
    );

router
    .route('/:id')
    .get(
        checkPermission('Read', 'Information'),
        informationController.getInformation
    )
    .patch(
        checkPermission('Edit', 'Information'),
        uploadMultipleOptional('information', 'attachments'),
        informationController.updateInformation
    )
    .delete(
        checkPermission('Delete', 'Information'),
        informationController.deleteInformation
    );

// Attachment management
router.delete('/:id/attachments/:attachmentId', 
    checkPermission('Edit', 'Information'),
    informationController.removeAttachment
);

// Category-specific routes
router.get('/category/:category', 
    checkPermission('Read', 'Information'),
    informationController.getInformationByCategory
);

// Publishing and status management
router.patch('/:id/publish', 
    checkPermission('Edit', 'Information'),
    informationController.publishInformation
);
router.patch('/:id/archive', 
    checkPermission('Edit', 'Information'),
    informationController.archiveInformation
);

// Utility routes
router.post('/target-audience-count', 
    checkPermission('Read', 'Information'),
    informationController.getTargetAudienceCount
);
router.get('/stats/dashboard', 
    checkPermission('Read', 'Information'),
    informationController.getInformationStats
);

module.exports = router;
