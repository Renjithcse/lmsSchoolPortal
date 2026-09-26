const express = require('express');
const router = express.Router();
const stateController = require('../../controllers/admin/stateController');
const authMiddlewares = require('../../middlewares/authMiddlewares');


// Routes for all states (GET, POST)
router.route('/')
    .get(authMiddlewares.protect, stateController.getStates)
    .post(authMiddlewares.protect, stateController.createState);

// Routes for a specific state by ID (GET, PUT, DELETE)
router.route('/:id')
    .get(authMiddlewares.protect, stateController.getStateById)
    .put(authMiddlewares.protect, stateController.updateState)
    .delete(authMiddlewares.protect, stateController.deleteState);

// Route to get states by country_id
router.route('/country/:country_id')
    .get(authMiddlewares.protect, stateController.getStatesByCountryId);

module.exports = router;
