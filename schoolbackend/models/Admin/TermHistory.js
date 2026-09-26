const mongoose = require('mongoose');

const termHistorySchema = new mongoose.Schema({
    academicYear: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: [true, "Please provide an academic year"],
        index: true
    },
    term: {
        type: String,
        required: [true, "Please provide a term name"],
        trim: true
    },
    startDate: {
        type: Date,
        required: [true, "Please provide a start date"]
    },
    endDate: {
        type: Date,
        required: [true, "Please provide an end date"]
    },
    isActive: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, "Description cannot exceed 500 characters"]
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for academic year name
termHistorySchema.virtual('academicYearName', {
    ref: 'AcademicYear',
    localField: 'academicYear',
    foreignField: '_id',
    justOne: true,
    options: { select: 'academicYear' }
});

// Virtual for duration in days
termHistorySchema.virtual('duration').get(function() {
    if (this.startDate && this.endDate) {
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    return 0;
});

// Virtual for status
termHistorySchema.virtual('status').get(function() {
    const now = new Date();
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    if (now < start) {
        return 'Upcoming';
    } else if (now >= start && now <= end) {
        return 'Active';
    } else {
        return 'Completed';
    }
});

// Index for efficient queries
termHistorySchema.index({ academicYear: 1, term: 1 });
termHistorySchema.index({ startDate: 1, endDate: 1 });
termHistorySchema.index({ isActive: 1 });

// Pre-save middleware to validate dates
termHistorySchema.pre('save', function(next) {
    if (this.startDate >= this.endDate) {
        return next(new Error('End date must be after start date'));
    }
    next();
});

// Pre-save middleware to update timestamps
termHistorySchema.pre('save', function(next) {
    if (this.isModified('isActive') && this.isActive) {
        // If this term is being set as active, deactivate all other terms
        this.constructor.updateMany(
            { _id: { $ne: this._id } },
            { isActive: false }
        );
    }
    next();
});

const TermHistory = mongoose.model('TermHistory', termHistorySchema);

module.exports = TermHistory;
