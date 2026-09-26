const express = require('express');
const router = express.Router();
const countryController = require('../../controllers/admin/countryController');
const authMiddlewares = require('../../middlewares/authMiddlewares');


// Routes for all countries (GET, POST)
router.route('/')
    .get(authMiddlewares.protect, countryController.getCountries)
    .post(authMiddlewares.protect, countryController.createCountry);

// Routes for specific country by ID (GET, PUT, DELETE)
router.route('/:id')
    .get(authMiddlewares.protect, countryController.getCountryById)
    .put(authMiddlewares.protect, countryController.updateCountry)
    .delete(authMiddlewares.protect, countryController.deleteCountry);

module.exports = router;