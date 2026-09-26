const express = require('express');
const authMiddlewares = require('../middlewares/authMiddlewares');
const assignmentController = require('../controllers/assignment/AssignmentController');
const publishController = require('../controllers/assignment/PublishAssignmentController');
const checkPermission = require('../middlewares/checkPermission');
const { uploadAssignmentAttachments } = require('../middlewares/s3UploadMiddleware');



const router = express.Router();

router.use(authMiddlewares.protect);


router
	.route('/')
	.get(checkPermission("Read", "Assignments"), assignmentController.getAllAssignments)
	.post(
        checkPermission("Create", "Assignments"),
        uploadAssignmentAttachments({
            questionField: "questionFile",
            questionFolder: "assignments/question",
            supportingField: "supportingDocuments",
            supportingFolder: "assignments/supporting",
            maxSupportingFiles: 5,
        }),
        assignmentController.createAssignment
    );

router
	.route('/:id')
	.get(checkPermission("Read", "Assignments"), assignmentController.viewAssignment)
	.put(
        checkPermission("Edit", "Assignments"),
        uploadAssignmentAttachments({
            questionField: "questionFile",
            questionFolder: "assignments/question",
            supportingField: "supportingDocuments",
            supportingFolder: "assignments/supporting",
            maxSupportingFiles: 5,
        }),
        assignmentController.updateAssignment
    )
	.delete(checkPermission("Delete", "Assignments"), assignmentController.deleteAssignment);




//publish exam
router
	.route('/:id/publish')
	.get(publishController.getPublishedAssignments)
	.post(publishController.createAssignmentPublish)
	

router
	.route('/published/:publishId')
	.get(publishController.getAllStudentsUnderPublishId)
	.put(publishController.updatePublishedAssignmentDates)
	.delete(publishController.deletePublishedAssignment);

router.route('/:id/getNotPublishedSections').get(publishController.getNonPublishedSections);

//Students Routes




router.route('/teacher/:attemptId').put(publishController.updateTeacherRemarks);


module.exports = router;
