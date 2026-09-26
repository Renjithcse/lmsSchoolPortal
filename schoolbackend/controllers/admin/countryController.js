const Country = require('../../models/Admin/Country');
const catchAsync = require('../../utils/catchAsync');

// Create a new country
exports.createCountry = catchAsync(async (req, res) => {
    const country = new Country(req.body);
    await country.save();
    res.status(201).json(country);
});

// Get all countries
exports.getCountries = catchAsync(async (req, res) => {
    const countries = await Country.find().select('_id name iso2 iso3 phone_code currency nationality emoji emojiU');
    res.status(200).json(countries);
});

// Get a single country by ID
exports.getCountryById = catchAsync(async (req, res) => {
    const country = await Country.findById(req.params.id);
    if (!country) {
        return res.status(404).json({ message: 'Country not found' });
    }
    res.status(200).json(country);
});

// Update a country by ID
exports.updateCountry = catchAsync(async (req, res) => {
    const country = await Country.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!country) {
        return res.status(404).json({ message: 'Country not found' });
    }
    res.status(200).json(country);
});

// Delete a country by ID
exports.deleteCountry = catchAsync(async (req, res) => {
    const country = await Country.findByIdAndDelete(req.params.id);
    if (!country) {
        return res.status(404).json({ message: 'Country not found' });
    }
    res.status(200).json({ message: 'Country deleted successfully' });
});
