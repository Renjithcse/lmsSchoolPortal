const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
    chapterName: {
        type: String,
        required: [true, 'Please provide a chapter name'],
        trim: true,
        maxlength: [200, 'Chapter name cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        trim: true
    },
    academicYear: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: [true, 'Please provide an academic year']
    },
    grade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grade',
        required: [true, 'Please provide a grade']
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: [true, 'Please provide a subject']
    },
    // Status and metadata
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
}, { 
    timestamps: true 
});

// Compound index for efficient queries
chapterSchema.index(
    { academicYear: 1, grade: 1, subject: 1 }
);

// Index for status
chapterSchema.index({ status: 1 });

// Index for search functionality
chapterSchema.index({ chapterName: 'text', description: 'text' });

const Chapter = mongoose.model('Chapter', chapterSchema);

module.exports = Chapter;
