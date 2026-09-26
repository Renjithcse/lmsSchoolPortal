const express = require('express');
const router = express.Router();
const authMiddlewares = require('../../middlewares/authMiddlewares');
const SubjectPermissionController = require('../../controllers/admin/SubjectPermissionController');
const checkPermission = require('../../middlewares/checkPermission');


router.use(authMiddlewares.protect);

router.route('/not-registerd-subjects').get(SubjectPermissionController.getGradeSubjects)
router.route('/me').get(SubjectPermissionController.getMySubjectPermissions)

router.route('/getTeacherPermissions/:id').get(SubjectPermissionController.getAllSubjectPermissions)

router.route('/').post(SubjectPermissionController.createSubjectPermission)
router.route('/:id')
    .put(SubjectPermissionController.updateSubjectPermission)
    .delete(SubjectPermissionController.deleteSubjectPermission)


module.exports = router;