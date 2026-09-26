const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    // Reference to book catalog
    bookCatalog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BookCatalog',
        required: [true, 'Please provide book catalog reference']
    },
    // Copy-specific information
    copyNumber: {
        type: String,
        required: [true, 'Please provide copy number'],
        trim: true
    },
    // Rack positioning
    rack: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rack',
        required: [true, 'Please provide rack information']
    },
    row: {
        type: Number,
        required: [true, 'Please provide row number'],
        min: [1, 'Row number must be at least 1']
    },
    position: {
        type: Number,
        required: [true, 'Please provide position number'],
        min: [1, 'Position number must be at least 1']
    },
    // Book status
    status: {
        type: String,
        enum: ['available', 'issued', 'lost', 'damaged', 'reserved'],
        default: 'available'
    },
    // Condition
    condition: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor'],
        default: 'good'
    },
    // Additional information
    description: {
        type: String,
        trim: true
    },
    coverImage: {
        type: String // S3 URL to the cover image
    },
    coverImageS3Key: {
        type: String // S3 key for deletion
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Indexes for better query performance
bookSchema.index({ bookCatalog: 1 });
bookSchema.index({ copyNumber: 1 });
bookSchema.index({ status: 1 });
bookSchema.index({ rack: 1, row: 1, position: 1 });

// Virtual for full location
bookSchema.virtual('location').get(function() {
    return `Rack ${this.rack?.rackNumber}, Row ${this.row}, Position ${this.position}`;
});

// Virtual for unique copy identifier
bookSchema.virtual('copyId').get(function() {
    return `${this.bookCatalog?.isbn}-${this.copyNumber}`;
});

// Ensure virtual fields are serialized
bookSchema.set('toJSON', { virtuals: true });
bookSchema.set('toObject', { virtuals: true });

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
