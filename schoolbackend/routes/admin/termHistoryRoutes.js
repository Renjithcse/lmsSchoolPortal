const express = require('express');
const router = express.Router();
const authMiddlewares = require('../../middlewares/authMiddlewares');
const termHistoryController = require('../../controllers/admin/termHistoryController');
const checkPermission = require('../../middlewares/checkPermission');
const { checkPermissionOr } = require('../../middlewares/checkPermission');

// Routes for all term histories (GET, POST)
router.route('/')
  .get(
    authMiddlewares.protect, 
    checkPermissionOr([
      { action: "Read", subject: "Settings" },
      { action: "Read", subject: "TermHistory" }
    ]), 
    termHistoryController.getTermHistories
  )
  .post(authMiddlewares.protect, checkPermission("Create", "TermHistory"), termHistoryController.createTermHistory);

// Routes for specific term history by ID (GET, PUT, DELETE)
router.route('/:id')
  .get(authMiddlewares.protect, checkPermission("Read", "TermHistory"), termHistoryController.getTermHistoryById)
  .put(authMiddlewares.protect, checkPermission("Edit", "TermHistory"), termHistoryController.updateTermHistory)
  .delete(authMiddlewares.protect, checkPermission("Delete", "TermHistory"), termHistoryController.deleteTermHistory);

// Route to set term as active
router.patch('/:id/activate', 
  authMiddlewares.protect, 
  checkPermission("Edit", "TermHistory"), 
  termHistoryController.setActiveTerm
);

// Route to get active term
router.get('/active/current', 
  authMiddlewares.protect, 
  checkPermission("Read", "TermHistory"), 
  termHistoryController.getActiveTerm
);

// Route to get current term (based on date)
router.get('/current/date', 
  authMiddlewares.protect, 
  checkPermission("Read", "TermHistory"), 
  termHistoryController.getCurrentTerm
);

// Route to get terms by academic year
router.get('/academic-year/:academicYearId', 
  authMiddlewares.protect, 
  checkPermission("Read", "TermHistory"), 
  termHistoryController.getTermsByAcademicYear
);

module.exports = router;
