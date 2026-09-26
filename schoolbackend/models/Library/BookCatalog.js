const mongoose = require('mongoose');

const bookCatalogSchema = new mongoose.Schema({
    isbn: {
        type: String,
        required: [true, 'Please provide ISBN number'],
        unique: true,
        trim: true
    },
    title: {
        type: String,
        required: [true, 'Please provide book title'],
        trim: true
    },
    author: {
        type: String,
        required: [true, 'Please provide author name'],
        trim: true
    },
    publisher: {
        type: String,
        trim: true
    },
    publicationYear: {
        type: Number,
        min: [1900, 'Publication year must be after 1900'],
        max: [new Date().getFullYear(), 'Publication year cannot be in the future']
    },
    edition: {
        type: String,
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BookCategory',
        required: [true, 'Please provide book category']
    },
    subject: {
        type: String,
        trim: true
    },
    language: {
        type: String,
        default: 'English',
        trim: true
    },
    pages: {
        type: Number,
        min: [1, 'Number of pages must be at least 1']
    },
    price: {
        type: Number,
        min: [0, 'Price cannot be negative']
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
bookCatalogSchema.index({ isbn: 1 });
bookCatalogSchema.index({ title: 1 });
bookCatalogSchema.index({ author: 1 });
bookCatalogSchema.index({ category: 1 });

const BookCatalog = mongoose.model('BookCatalog', bookCatalogSchema);

module.exports = BookCatalog;
