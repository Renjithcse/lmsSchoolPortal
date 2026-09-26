const mongoose = require('mongoose');

const informationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxLength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Information Desk', 'Help Desk', 'General Information'],
        default: 'General Information'
    },
    attachments: [{
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
            required: true
        },
        mimeType: {
            type: String,
            required: true
        },
        s3Key: {
            type: String,
            required: false // For backward compatibility with old files
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Publishing Configuration
    publishTo: {
        type: String,
        required: [true, 'Publish target is required'],
        enum: ['All Teachers', 'All Students', 'Both Teachers and Students', 'Specific Students'],
        default: 'All Students'
    },
    
    // Student-specific targeting
    studentTargeting: {
        academicYear: {
            type: String
        },
        targetType: {
            type: String,
            enum: ['All Students', 'Gender Wise', 'Grade Wise', 'Grade and Gender Wise', 'Section Wise'],
            default: 'All Students'
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Both'],
            default: 'Both'
        },
        grades: [{
            type: String
        }],
        // Single grade for Section Wise targeting
        grade: {
            _id: {
                type: String
            },
            gradeName: {
                type: String
            }
        },
        // Section gender for Section Wise targeting
        sectionGender: {
            type: String,
            enum: ['Male', 'Female', 'Both'],
            default: 'Both'
        },
        sections: [{
            _id: {
                type: String
            },
            sectionName: {
                type: String
            },
            grade: {
                type: String
            },
            gender: {
                type: String
            }
        }]
    },
    
    // Status and metadata
    status: {
        type: String,
        enum: ['Draft', 'Published', 'Archived'],
        default: 'Draft'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    tags: [{
        type: String,
        trim: true
    }],
    
    // Publishing details
    publishedAt: {
        type: Date,
        default: null
    },
    scheduledPublishDate: {
        type: Date,
        default: null
    },
    expiryDate: {
        type: Date,
        default: null
    },
    
    // View tracking
    viewCount: {
        type: Number,
        default: 0
    },
    viewedBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'viewedBy.userType'
        },
        userType: {
            type: String,
            enum: ['Student', 'Teacher']
        },
        viewedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Notification tracking
    notificationSent: {
        type: Boolean,
        default: false
    },
    notificationSentAt: {
        type: Date,
        default: null
    },
    notificationRecipients: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'notificationRecipients.userType'
        },
        userType: {
            type: String,
            enum: ['Student', 'Teacher']
        },
        sentAt: {
            type: Date,
            default: Date.now
        },
        readAt: {
            type: Date,
            default: null
        }
    }],
    
    // Creator and updater information
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
    timestamps: true
});

// Indexes for better performance
informationSchema.index({ category: 1, status: 1 });
informationSchema.index({ publishTo: 1, status: 1 });
informationSchema.index({ 'studentTargeting.academicYear': 1, 'studentTargeting.grades': 1 });
informationSchema.index({ 'studentTargeting.academicYear': 1, 'studentTargeting.grade._id': 1 });
informationSchema.index({ publishedAt: -1 });
informationSchema.index({ priority: 1, publishedAt: -1 });
informationSchema.index({ createdBy: 1 });

// Virtual for checking if information is active
informationSchema.virtual('isActive').get(function() {
    const now = new Date();
    return this.status === 'Published' && 
           (!this.expiryDate || this.expiryDate > now);
});

// Method to check if user can view this information
informationSchema.methods.canUserView = async function(user) {
    if (this.status !== 'Published') return false;
    
    // Check expiry
    if (this.expiryDate && this.expiryDate < new Date()) return false;
    
    // Check publish target
    if (this.publishTo === 'All Teachers' && user.role !== 'teacher') return false;
    if (this.publishTo === 'All Students' && user.role !== 'student') return false;
    
    // For students, check targeting criteria
    if (user.role === 'student' && (this.publishTo === 'All Students' || this.publishTo === 'Specific Students' || this.publishTo === 'Both Teachers and Students')) {
        const targeting = this.studentTargeting;
        
        // Helper function to normalize gender values
        const normalizeGender = (gender) => {
            if (!gender) return '';
            return gender.toLowerCase().trim();
        };
        
        // Check academic year - convert academic year string to ObjectId for comparison
        if (targeting.academicYear) {
            if (!user.academicYear) return false;
            const AcademicYear = mongoose.model('AcademicYear');
            const academicYearObj = await AcademicYear.findOne({ 
                academicYear: targeting.academicYear 
            }).select('_id');
            if (academicYearObj && academicYearObj._id.toString() !== user.academicYear.toString()) {
                return false;
            }
        }
        
        // Check targeting type
        const Grade = mongoose.model('Grade');
        const Section = mongoose.model('Section');
        
        switch (targeting.targetType) {
            case 'Gender Wise':
                const targetingGender = normalizeGender(targeting.gender);
                const userGender = normalizeGender(user.gender);
                if (targetingGender !== 'both' && targetingGender !== userGender) {
                    return false;
                }
                break;
                
            case 'Grade Wise':
                if (targeting.grades && targeting.grades.length > 0) {
                    // Convert grade names to ObjectIds for comparison
                    const gradeObjects = await Grade.find({ 
                        gradeName: { $in: targeting.grades } 
                    }).select('_id');
                    const gradeIds = gradeObjects.map(g => g._id.toString());
                    if (!gradeIds.includes(user.grade.toString())) return false;
                }
                break;
                
            case 'Grade and Gender Wise':
                if (targeting.grades && targeting.grades.length > 0) {
                    const gradeObjects = await Grade.find({ 
                        gradeName: { $in: targeting.grades } 
                    }).select('_id');
                    const gradeIds = gradeObjects.map(g => g._id.toString());
                    if (!gradeIds.includes(user.grade.toString())) return false;
                }
                const targetingGender2 = normalizeGender(targeting.gender);
                const userGender2 = normalizeGender(user.gender);
                if (targetingGender2 !== 'both' && targetingGender2 !== userGender2) {
                    return false;
                }
                break;
                
            case 'Section Wise':
                if (targeting.sections && targeting.sections.length > 0) {
                    let sectionMatch = false;
                    for (const s of targeting.sections) {
                        // Check if the user's section matches any of the targeted sections
                        if (s._id && s._id.toString() === user.section.toString()) {
                            sectionMatch = true;
                            break;
                        }
                    }
                    if (!sectionMatch) return false;
                }
                
                // For section-wise targeting, check sectionGender instead of gender
                const sectionGender = targeting.sectionGender || targeting.gender;
                const targetingGender3 = normalizeGender(sectionGender);
                const userGender3 = normalizeGender(user.gender);
                if (targetingGender3 !== 'both' && targetingGender3 !== userGender3) {
                    return false;
                }
                break;
        }
    }
    
    return true;
};

// Method to get target audience count (for notification planning)
informationSchema.methods.getTargetAudienceQuery = async function() {
    const query = {};
    
    if (this.publishTo === 'All Teachers') {
        return { model: 'Teacher', query: { status: 'active' } };
    } else if (this.publishTo === 'All Students') {
        // For students, we query the Student model directly (no role field needed)
        const studentQuery = {};
        await this._addStudentTargetingToQuery(studentQuery);
        return { model: 'Student', query: studentQuery };
    } else if (this.publishTo === 'Both Teachers and Students') {
        // This will need to be handled as two separate queries
        return [
            { model: 'Teacher', query: { status: 'active' } },
            await this._getStudentQuery()
        ];
    } else if (this.publishTo === 'Specific Students') {
        // For students, we query the Student model directly (no role field needed)
        const studentQuery = {};
        await this._addStudentTargetingToQuery(studentQuery);
        return { model: 'Student', query: studentQuery };
    }
    
    return query;
};

informationSchema.methods._getStudentQuery = async function() {
    const studentQuery = {};
    await this._addStudentTargetingToQuery(studentQuery);
    return { model: 'Student', query: studentQuery };
};

informationSchema.methods._addStudentTargetingToQuery = async function(query) {
    const targeting = this.studentTargeting;
    const Grade = mongoose.model('Grade');
    const Section = mongoose.model('Section');
    const AcademicYear = mongoose.model('AcademicYear');
    
    // Convert academic year string to ObjectId if needed
    if (targeting.academicYear) {
        const academicYearObj = await AcademicYear.findOne({ 
            academicYear: targeting.academicYear 
        }).select('_id');
        if (academicYearObj) {
            query.academicYear = academicYearObj._id;
        }
    }
    
    switch (targeting.targetType) {
        case 'Gender Wise':
            if (targeting.gender !== 'Both') {
                query.gender = targeting.gender.toLowerCase();
            }
            break;
            
        case 'Grade Wise':
            if (targeting.grades && targeting.grades.length > 0) {
                // Convert grade names to ObjectIds
                const gradeObjects = await Grade.find({ 
                    gradeName: { $in: targeting.grades } 
                }).select('_id');
                const gradeIds = gradeObjects.map(g => g._id);
                query.grade = { $in: gradeIds };
            }
            break;
            
        case 'Grade and Gender Wise':
            if (targeting.grades && targeting.grades.length > 0) {
                // Convert grade names to ObjectIds
                const gradeObjects = await Grade.find({ 
                    gradeName: { $in: targeting.grades } 
                }).select('_id');
                const gradeIds = gradeObjects.map(g => g._id);
                query.grade = { $in: gradeIds };
            }
            if (targeting.gender !== 'Both') {
                query.gender = targeting.gender.toLowerCase();
            }
            break;
            
        case 'Section Wise':
            if (targeting.sections && targeting.sections.length > 0) {
                // Use the section IDs directly from the targeting data
                const sectionIds = targeting.sections.map(s => s._id);
                query.section = { $in: sectionIds };
            }
            // Also filter by grade if specified
            if (targeting.grade && targeting.grade._id) {
                query.grade = targeting.grade._id;
            }
            // Also filter by section gender if specified
            if (targeting.sectionGender && targeting.sectionGender !== 'Both') {
                query.gender = targeting.sectionGender.toLowerCase();
            }
            break;
    }
};

// Pre-save middleware to set publishedAt when status changes to Published
informationSchema.pre('save', function(next) {
    if (this.isModified('status') && this.status === 'Published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    // If scheduledPublishDate is set and it's in the past, auto-publish
    if (this.scheduledPublishDate && this.scheduledPublishDate <= new Date() && this.status === 'Draft') {
        this.status = 'Published';
        if (!this.publishedAt) {
            this.publishedAt = this.scheduledPublishDate;
        }
    }
    next();
});

// Ensure JSON output includes virtuals
informationSchema.set('toJSON', { virtuals: true });
informationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Information', informationSchema);
