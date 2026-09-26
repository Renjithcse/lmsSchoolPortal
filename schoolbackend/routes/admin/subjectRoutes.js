const express = require('express');
const subjectController = require('../../controllers/admin/subjectController');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const checkPermission = require('../../middlewares/checkPermission');

const router = express.Router();

// Protect all routes
router.use(authMiddlewares.protect);

router
    .route('/')
    .post(checkPermission("Create", "Subject"), subjectController.createSubject)
    .get(checkPermission("Read", "Subject"), subjectController.getSubjects);

router
    .route('/:id')
    .get(checkPermission("Read", "Subject"), subjectController.getSubjectById)
    .patch(checkPermission("Edit", "Subject"), subjectController.updateSubject)
    .delete(checkPermission("Delete", "Subject"), subjectController.deleteSubject);

module.exports = router;
