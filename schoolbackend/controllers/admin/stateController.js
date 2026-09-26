const State = require('../../models/Admin/State');
const catchAsync = require('../../utils/catchAsync');
const Country = require('../../models/Admin/Country');


// Create a new state
exports.createState = catchAsync(async (req, res) => {
    const state = new State(req.body);
    await state.save();
    res.status(201).json(state);
});

// Get all states
exports.getStates = catchAsync(async (req, res) => {
    const states = await State.find().select('name country_id country_code country_name state_code latitude longitude');
    res.status(200).json(states);
});

//Get All States by Country ID
exports.getStatesByCountryId = catchAsync(async (req, res) => {
    const { country_id } = req.params;

    console.log({country_id})


    let country = await Country.findOne({_id: parseInt(country_id) });

    if(!country){
        return res.status(404).json({ message: 'Country not found' });
    }

    const states = await State.find({ country_id: country?.id });

    
    if (states.length === 0) {
        return res.status(404).json({ message: 'No states found for this country' });
    }

    res.status(200).json(states);
});

// Get a single state by ID
exports.getStateById = catchAsync(async (req, res) => {
    const state = await State.findById(req.params.id);
    if (!state) {
        return res.status(404).json({ message: 'State not found' });
    }
    res.status(200).json(state);
});

// Update a state by ID
exports.updateState = catchAsync(async (req, res) => {
    const state = await State.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!state) {
        return res.status(404).json({ message: 'State not found' });
    }
    res.status(200).json(state);
});

// Delete a state by ID
exports.deleteState = catchAsync(async (req, res) => {
    const state = await State.findByIdAndDelete(req.params.id);
    if (!state) {
        return res.status(404).json({ message: 'State not found' });
    }
    res.status(200).json({ message: 'State deleted successfully' });
});
