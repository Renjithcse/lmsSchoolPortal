const City = require('../../models/Admin/City');
const catchAsync = require('../../utils/catchAsync');
const Country = require('../../models/Admin/Country');


// Create a new city
exports.createCity = catchAsync(async (req, res) => {
    const city = new City(req.body);
    await city.save();
    res.status(201).json(city);
});

// Get all cities
exports.getCities = catchAsync(async (req, res) => {
    const cities = await City.find().select('name state_id state_code state_name country_id country_code country_name latitude longitude wikiDataId');
    res.status(200).json(cities);
});

// Get a single city by ID
exports.getCityById = catchAsync(async (req, res) => {
    const city = await City.findById(req.params.id);
    if (!city) {
        return res.status(404).json({ message: 'City not found' });
    }
    res.status(200).json(city);
});

// Get cities by state ID
exports.getCitiesByStateId = catchAsync(async (req, res) => {
    const { state_id } = req.params;
    const cities = await City.find({ state_id });

    if (cities.length === 0) {
        return res.status(404).json({ message: 'No cities found for this state' });
    }

    res.status(200).json(cities);
});

// Get cities by country ID
exports.getCitiesByCountryId = catchAsync(async (req, res) => {
    const { country_id } = req.params;

    const country =  await Country.findById(country_id);

    const cities = await City.find({ country_id: country?.id });

    if (cities.length === 0) {
        return res.status(404).json({ message: 'No cities found for this country' });
    }

    res.status(200).json(cities);
});

// Update a city by ID
exports.updateCity = catchAsync(async (req, res) => {
    const city = await City.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!city) {
        return res.status(404).json({ message: 'City not found' });
    }
    res.status(200).json(city);
});

// Delete a city by ID
exports.deleteCity = catchAsync(async (req, res) => {
    const city = await City.findByIdAndDelete(req.params.id);
    if (!city) {
        return res.status(404).json({ message: 'City not found' });
    }
    res.status(200).json({ message: 'City deleted successfully' });
});
