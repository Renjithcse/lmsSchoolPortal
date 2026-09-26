const express = require('express');
const router = express.Router();
const authMiddlewares = require('../../middlewares/authMiddlewares');
const academicController = require('../../controllers/admin/academicController');
const checkPermission = require('../../middlewares/checkPermission');



// Routes for all academics (GET, POST)
router.route('/')
  .get(authMiddlewares.protect,  academicController.getAcademics)
  .post(authMiddlewares.protect, checkPermission("Create", "Academic"), academicController.createAcademic);

// Routes for specific academic by ID (GET, PUT, DELETE)
router.route('/:id')
  .get(authMiddlewares.protect, checkPermission("Read", "Academic"), academicController.getAcademicById)
  .put(authMiddlewares.protect, checkPermission("Edit", "Academic"), academicController.updateAcademic)
  .delete(authMiddlewares.protect, checkPermission("Delete", "Academic"), academicController.deleteAcademic);

module.exports = router;