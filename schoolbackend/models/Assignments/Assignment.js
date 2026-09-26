const mongoose = require('mongoose');
const { default: slugify } = require('slugify');

const AssignmentSchema = new mongoose.Schema({
    assignmentName: {
        type: String,
        required: [true, 'An exam must have a name'],
    },
    academicYear: {
        type: mongoose.Schema.ObjectId,
        ref: 'AcademicYear',
        required: [true, 'Academic Year is required'],
    },
    grade:{
        type: mongoose.Schema.ObjectId,
        ref: 'Grade',
        required: [true, 'Grade is required'],
    },
    term: {
        type: String,
        required: [true, 'Term is required'],
    },
    subjectId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Subject',
        required: [true, 'Subject is required'],
    },
    question: {
        type: String,
        required: [true, 'Question is required'],
    },
    questionFile : {
        type: String // S3 URL to the question file
    },
    questionFileS3Key: {
        type: String // S3 key for deletion
    },
    supportingNotes: {
        type: String,
    },
    supportingDocuments: {
        type: [{
            fileName: {
                type: String,
                required: true,
            },
            filePath: {
                type: String,
                required: true,
            },
            mimeType: {
                type: String,
                required: true,
            },
            uploadedAt: {
                type: Date,
                default: Date.now,
            },
        }],
        default: [],
    },
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
    slug: {
        type: String,
        unique: true,
    },
}, {
    timestamps: true,
});

// Create a unique index for examName, academicYear, grade, term, and subjectId combination
AssignmentSchema.index({ assignmentName: 1, academicYear: 1, grade:1, term: 1, subjectId: 1 }, { unique: true });

// Pre-save middleware to create slug before saving
AssignmentSchema.pre('save', function (next) {
    if (!this.isModified('assignmentName')) {
        return next();
    }

    // Generate slug using slugify
    this.slug = slugify(this.assignmentName, { lower: true, strict: true });
    next();
});

const Assignment = mongoose.model('Assignment', AssignmentSchema);

module.exports = Assignment;
