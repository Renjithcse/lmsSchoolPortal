const mongoose = require('mongoose');

const rackSchema = new mongoose.Schema({
    rackNumber: {
        type: String,
        required: [true, 'Please provide a rack number'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    numberOfRows: {
        type: Number,
        required: [true, 'Please provide number of rows'],
        min: [1, 'Number of rows must be at least 1']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Index for better query performance
rackSchema.index({ rackNumber: 1, academicYear: 1 });

const Rack = mongoose.model('Rack', rackSchema);

module.exports = Rack;
