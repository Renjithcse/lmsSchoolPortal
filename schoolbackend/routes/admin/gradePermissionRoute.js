const express = require('express');
const router = express.Router();
const authMiddlewares = require('../../middlewares/authMiddlewares');
const GradePermissionController = require('../../controllers/admin/GradePermissionController');
const checkPermission = require('../../middlewares/checkPermission');


router.use(authMiddlewares.protect);

router.route('/me').get(GradePermissionController.getLoggedInTeacherGrades)
router.route('/me/gender').get(GradePermissionController.getLoggedInTeacherGender)
router.route('/me/sections').get(GradePermissionController.getLoggedInTeacherSection)

router.route('/getTeacherPermissions/:id').get(GradePermissionController.getAllGradePermissions)

router.route('/').post(GradePermissionController.updateGradePermission)


module.exports = router;