const mongoose = require('mongoose');

const bookIssueSchema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: [true, 'Please provide book information']
    },
    issuedTo: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'issuedToModel',
        required: [true, 'Please provide who the book is issued to']
    },
    issuedToModel: {
        type: String,
        required: true,
        enum: ['Student', 'Teacher']
    },
    issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please provide who issued the book']
    },
    issueDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    dueDate: {
        type: Date,
        required: [true, 'Please provide due date']
    },
    returnDate: {
        type: Date
    },
    returnedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['issued', 'returned', 'overdue', 'lost'],
        default: 'issued'
    },
    // Renewal tracking
    renewalCount: {
        type: Number,
        default: 0,
        min: [0, 'Renewal count cannot be negative']
    },
    lastRenewalDate: {
        type: Date
    },
    // Fine tracking
    fineAmount: {
        type: Number,
        default: 0,
        min: [0, 'Fine amount cannot be negative']
    },
    finePaid: {
        type: Boolean,
        default: false
    },
    finePaidDate: {
        type: Date
    },
    // Notes
    issueNotes: {
        type: String,
        trim: true
    },
    returnNotes: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// Indexes for better query performance
bookIssueSchema.index({ book: 1 });
bookIssueSchema.index({ issuedTo: 1 });
bookIssueSchema.index({ status: 1 });
bookIssueSchema.index({ dueDate: 1 });
bookIssueSchema.index({ issueDate: 1 });

// Virtual for calculating if overdue
bookIssueSchema.virtual('isOverdue').get(function() {
    if (this.status === 'returned') return false;
    return new Date() > this.dueDate;
});

// Virtual for calculating days overdue
bookIssueSchema.virtual('daysOverdue').get(function() {
    if (this.status === 'returned' || new Date() <= this.dueDate) return 0;
    const diffTime = Math.abs(new Date() - this.dueDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Ensure virtual fields are serialized
bookIssueSchema.set('toJSON', { virtuals: true });
bookIssueSchema.set('toObject', { virtuals: true });

const BookIssue = mongoose.model('BookIssue', bookIssueSchema);

module.exports = BookIssue;
