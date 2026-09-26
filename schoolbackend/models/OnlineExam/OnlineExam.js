const mongoose = require('mongoose');
const { default: slugify } = require('slugify');

const onlineExamSchema = new mongoose.Schema({
    examName: {
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Virtual: number of publishes for this exam
onlineExamSchema.virtual('publishCount', {
    ref: 'Publish',
    localField: '_id',
    foreignField: 'exam',
    count: true,
});

// Create a unique index for examName, academicYear, grade, term, and subjectId combination
onlineExamSchema.index({ examName: 1, academicYear: 1, grade:1, term: 1, subjectId: 1 }, { unique: true });

// Pre-save middleware to create slug before saving
onlineExamSchema.pre('save', function (next) {
    if (!this.isModified('examName')) {
        return next();
    }

    // Generate slug using slugify
    this.slug = slugify(this.examName, { lower: true, strict: true });
    next();
});

const OnlineExam = mongoose.model('OnlineExam', onlineExamSchema);

module.exports = OnlineExam;
