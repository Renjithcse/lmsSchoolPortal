const mongoose = require('mongoose');

const subjectNotesSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
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
    gender: {
        type: String,
        enum: ['male', 'female', 'both'],
        required: function() {
            return this.status === 'published';
        }
    },
    section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: function() {
            return this.status === 'published';
        }
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: [true, 'Please provide a subject']
    },
    // Documents/files attached to the notes (optional)
    documents: {
        type: [{
            fileName: {
                type: String,
                required: true
            },
            originalName: {
                type: String,
                required: true
            },
            filePath: {
                type: String,
                required: true
            },
            fileSize: {
                type: Number,
                required: function() {
                    return !this.isLink;
                }
            },
            mimeType: {
                type: String,
                required: function() {
                    return !this.isLink;
                }
            },
            uploadedAt: {
                type: Date,
                default: Date.now
            },
            s3Key: {
                type: String,
                required: function() {
                    return !this.isLink;
                }
            },
            isLink: {
                type: Boolean,
                default: false
            },
            linkUrl: {
                type: String,
                required: function() {
                    return this.isLink === true;
                }
            }
        }],
        default: []
    },
    // Status and metadata
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    publishedAt: {
        type: Date
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
    // Additional metadata
    tags: [{
        type: String,
        trim: true
    }],
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
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
subjectNotesSchema.index(
    { academicYear: 1, grade: 1, gender: 1, section: 1, subject: 1 }
);

// Index for status and published notes
subjectNotesSchema.index({ status: 1, publishedAt: -1 });

// Index for search functionality
subjectNotesSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Pre-save middleware to set publishedAt when status changes to published
subjectNotesSchema.pre('save', function(next) {
    if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    next();
});

// Virtual for document count
subjectNotesSchema.virtual('documentCount').get(function() {
    return this.documents ? this.documents.length : 0;
});

// Method to increment view count
subjectNotesSchema.methods.incrementViewCount = function() {
    this.viewCount = (this.viewCount || 0) + 1;
    this.lastViewedAt = new Date();
    return this.save();
};

// Static method to find notes for a specific class and subject
subjectNotesSchema.statics.findForClass = function(academicYear, grade, gender, section, subject, status = 'published') {
    const query = {
        academicYear,
        grade,
        subject,
        status,
        $or: [
            // Notes published for the same section
            { section: section },
            // Notes published for the same grade and academic year (cross-section notes)
            { 
                grade: grade,
                academicYear: academicYear,
                // Allow notes published for the same gender or "both"
                $or: [
                    { gender: gender },
                    { gender: 'both' }
                ]
            }
        ]
    };
    
    return this.find(query)
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('section', 'sectionName')
        .populate('subject', 'subjectName')
        .populate('createdBy', 'name email')
        .sort({ publishedAt: -1, createdAt: -1 });
};

// Static method to find all notes for a student's subjects
subjectNotesSchema.statics.findForStudent = function(academicYear, grade, gender, section, subjects = []) {
    const query = {
        academicYear,
        grade,
        status: 'published',
        $or: [
            // Notes published for the same section
            { section: section },
            // Notes published for the same grade and academic year (cross-section notes)
            { 
                grade: grade,
                academicYear: academicYear,
                // Allow notes published for the same gender or "both"
                $or: [
                    { gender: gender },
                    { gender: 'both' }
                ]
            }
        ]
    };
    
    if (subjects.length > 0) {
        query.subject = { $in: subjects };
    }
    
    return this.find(query)
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('section', 'sectionName')
        .populate('subject', 'subjectName')
        .populate('createdBy', 'name email')
        .sort({ subject: 1, publishedAt: -1 });
};

const SubjectNotes = mongoose.model('SubjectNotes', subjectNotesSchema);

module.exports = SubjectNotes;
