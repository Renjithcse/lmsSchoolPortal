const mongoose = require('mongoose');

const publishedChapterSchema = new mongoose.Schema({
    // Reference to the original chapter
    chapter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chapter',
        required: [true, 'Please provide the chapter reference']
    },
    // Publication details
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
    gender: {
        type: String,
        enum: ['male', 'female'],
        required: [true, 'Please provide a gender']
    },
    section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: [true, 'Please provide a section']
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: [true, 'Please provide a subject']
    },
    // Publication metadata
    publishedAt: {
        type: Date,
        default: Date.now
    },
    publishedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Status tracking
    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active'
    }
}, { 
    timestamps: true 
});

// Compound index for efficient queries
publishedChapterSchema.index(
    { academicYear: 1, grade: 1, gender: 1, section: 1, subject: 1 }
);

// Index for chapter reference
publishedChapterSchema.index({ chapter: 1 });

// Index for status and published date
publishedChapterSchema.index({ status: 1, publishedAt: -1 });

// Prevent duplicate publications (same chapter to same gender and section)
publishedChapterSchema.index(
    { chapter: 1, gender: 1, section: 1 },
    { unique: true, name: 'unique_publication' }
);

// Static method to find published chapters for a specific class and subject
publishedChapterSchema.statics.findForClass = function(academicYear, grade, gender, section, subject, status = 'active') {
    const query = {
        academicYear,
        grade,
        gender,
        section,
        subject,
        status
    };
    
    return this.find(query)
        .populate('chapter')
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('section', 'sectionName')
        .populate('subject', 'subjectName')
        .populate('publishedBy', 'name email')
        .sort({ publishedAt: -1 });
};

// Static method to find all published chapters for a student's subjects
publishedChapterSchema.statics.findForStudent = function(academicYear, grade, gender, section, subjects = []) {
    const query = {
        academicYear,
        grade,
        gender,
        section,
        status: 'active'
    };
    
    if (subjects.length > 0) {
        query.subject = { $in: subjects };
    }
    
    return this.find(query)
        .populate('chapter')
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('section', 'sectionName')
        .populate('subject', 'subjectName')
        .populate('publishedBy', 'name email')
        .sort({ subject: 1, publishedAt: -1 });
};

const PublishedChapter = mongoose.model('PublishedChapter', publishedChapterSchema);

module.exports = PublishedChapter;
