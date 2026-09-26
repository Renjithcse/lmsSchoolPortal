const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    subjectName: {
        type: String,
        required: [true, 'Please provide a subject name'],
        unique: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
});

// Handling duplicate subject name errors
subjectSchema.post('save', function(error, doc, next) {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('Subject name must be unique'));
    } else {
        next(error);
    }
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
