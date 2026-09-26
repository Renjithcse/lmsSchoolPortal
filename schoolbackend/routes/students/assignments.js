const express = require("express");
const router = express.Router();
const publishController = require('../../controllers/assignment/PublishAssignmentController');


const authMiddlewares = require("../../middlewares/authMiddlewares");

router.use(authMiddlewares.protect);

router.route('/')
    .get(publishController.getAssignmentsSummaryByStudentId)
    .put(publishController.saveStudentAssignment);
    

router.route('/subject/:id').get(publishController.getStudentsSubjectWiseAssignments);
router.route('/:assignmentId').get(publishController.getSingleAssignment);


module.exports = router;