const express = require('express');
const router = express.Router();
const cityController = require('../../controllers/admin/cityController');
const authMiddlewares = require('../../middlewares/authMiddlewares');


// Routes for all cities (GET, POST)
router.route('/')
    .get(authMiddlewares.protect, cityController.getCities)
    .post(authMiddlewares.protect, cityController.createCity);

// Routes for a specific city by ID (GET, PUT, DELETE)
router.route('/:id')
    .get(authMiddlewares.protect, cityController.getCityById)
    .put(authMiddlewares.protect, cityController.updateCity)
    .delete(authMiddlewares.protect, cityController.deleteCity);

// Route to get cities by state_id
router.route('/state/:state_id')
    .get(authMiddlewares.protect, cityController.getCitiesByStateId);

// Route to get cities by country_id
router.route('/country/:country_id')
    .get(authMiddlewares.protect, cityController.getCitiesByCountryId);

module.exports = router;
