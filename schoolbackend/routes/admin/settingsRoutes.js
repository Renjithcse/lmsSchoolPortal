const express = require('express');
const router = express.Router();
const authMiddlewares = require('../../middlewares/authMiddlewares');
const settingsController = require('../../controllers/admin/SettingController');
const checkPermission = require('../../middlewares/checkPermission');


router.use(authMiddlewares.protect);


// Routes for all academics (GET, POST)
router.route('/')
  .get(
    // checkPermission("Read", "Settings"), 
    settingsController.getSetting)
  .post(
    checkPermission("Create", "Settings"), 
    settingsController.createSetting);

// Routes for specific academic by ID (GET, PUT, DELETE)
router.route('/:id')
  .put(
    checkPermission("Edit", "Settings"), 
    settingsController.updateSetting)

// Get current settings (for teachers/students - no permission check needed)
router.route('/current')
  .get(
    authMiddlewares.restrictTo('user', 'admin'),
    settingsController.getCurrentSettings)

// Get school timings for specific grade and gender
router.route('/school-timings')
  .get(
    checkPermission("Read", "Settings"), 
    settingsController.getSchoolTimings)

// Update only library settings
router.route('/:id/library-settings')
  .put(
    checkPermission("Edit", "Settings"), 
    settingsController.updateLibrarySettings)

// Update only school timings
router.route('/:id/school-timings')
  .put(
    checkPermission("Edit", "Settings"), 
    settingsController.updateSchoolTimings)

module.exports = router;