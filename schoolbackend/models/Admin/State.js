const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
    _id: { type: Number, required: true },
    name: { type: String, required: true },
    country_id: { type: Number, required: true, index: true },
    country_code: { type: String, required: true },
    country_name: { type: String, required: true },
    state_code: { type: String, required: false },
    type: { type: String, default: null },
    latitude: { type: String, default: null },
    longitude: { type: String, default: null },
}, { timestamps: true, _id: false });

const State = mongoose.model('State', stateSchema);

module.exports = State;