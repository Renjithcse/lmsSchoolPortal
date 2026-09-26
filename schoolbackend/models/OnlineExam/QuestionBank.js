const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
    subject: {
        type: mongoose.Schema.ObjectId,
        ref: 'Subject',
        required: [true, 'Question bank must belong to a subject'],
    },
    questionBankName: {
        type: String,
        required: [true, 'A question bank must have a name'],
    },
    grades: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Grade'
        }
    ],
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    updatedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

// Add unique index to enforce unique questionBankName under the same subject
questionBankSchema.index({ subject: 1, questionBankName: 1 }, { unique: true });

// Add compound index for common query pattern: status + subject + createdBy
questionBankSchema.index({ status: 1, subject: 1, createdBy: 1 });

// Add index for status + createdBy (for admin queries without subject filter)
questionBankSchema.index({ status: 1, createdBy: 1 });

// Add index for status + subject (for admin queries with subject filter)
questionBankSchema.index({ status: 1, subject: 1 });

// Add index for createdBy (for user-specific queries)
questionBankSchema.index({ createdBy: 1 });

// Add index for subject (for subject-specific queries)
questionBankSchema.index({ subject: 1 });

// Add index for grades
questionBankSchema.index({ grades: 1 });

const QuestionBank = mongoose.model('QuestionBank', questionBankSchema);
module.exports = QuestionBank;
