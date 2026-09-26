const express = require('express');
const sectionController = require('../../controllers/admin//sectionController');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const checkPermission = require('../../middlewares/checkPermission');

const router = express.Router();

router.use(authMiddlewares.protect);

router
    .route('/')
    .get(checkPermission("Read", "Section"), sectionController.getSections)
    .post(checkPermission("Create", "Section"), sectionController.createSection);

router
    .route('/:id')
    .get(checkPermission("Read", "Section"), sectionController.getSectionById)
    .patch(checkPermission("Edit", "Section"), sectionController.updateSection)
    .delete(checkPermission("Delete", "Section"), sectionController.deleteSection);

module.exports = router;
