const mongoose = require('mongoose');

const publishedSubjectNotesSchema = new mongoose.Schema({
    // Reference to the original subject note
    subjectNote: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubjectNotes',
        required: [true, 'Please provide the subject note reference']
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
    },
    // View tracking
    viewCount: {
        type: Number,
        default: 0
    },
    lastViewedAt: {
        type: Date
    }
}, { 
    timestamps: true 
});

// Compound index for efficient queries
publishedSubjectNotesSchema.index(
    { academicYear: 1, grade: 1, gender: 1, section: 1, subject: 1 }
);

// Index for subject note reference
publishedSubjectNotesSchema.index({ subjectNote: 1 });

// Index for status and published date
publishedSubjectNotesSchema.index({ status: 1, publishedAt: -1 });

// Prevent duplicate publications (same note to same gender and section)
publishedSubjectNotesSchema.index(
    { subjectNote: 1, gender: 1, section: 1 },
    { unique: true, name: 'unique_publication' }
);

// Method to increment view count
publishedSubjectNotesSchema.methods.incrementViewCount = function() {
    this.viewCount = (this.viewCount || 0) + 1;
    this.lastViewedAt = new Date();
    return this.save();
};

// Static method to find published notes for a specific class and subject
publishedSubjectNotesSchema.statics.findForClass = function(academicYear, grade, gender, section, subject, status = 'active') {
    const query = {
        academicYear,
        grade,
        gender,
        section,
        subject,
        status
    };
    
    return this.find(query)
        .populate('subjectNote')
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('section', 'sectionName')
        .populate('subject', 'subjectName')
        .populate('publishedBy', 'name email')
        .sort({ publishedAt: -1 });
};

// Static method to find all published notes for a student's subjects
publishedSubjectNotesSchema.statics.findForStudent = function(academicYear, grade, gender, section, subjects = []) {
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
        .populate('subjectNote')
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('section', 'sectionName')
        .populate('subject', 'subjectName')
        .populate('publishedBy', 'name email')
        .sort({ subject: 1, publishedAt: -1 });
};

const PublishedSubjectNotes = mongoose.model('PublishedSubjectNotes', publishedSubjectNotesSchema);

module.exports = PublishedSubjectNotes;

