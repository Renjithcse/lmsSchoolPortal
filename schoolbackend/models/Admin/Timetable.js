const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a timetable name'],
        trim: true
    },
    academicYear: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: [true, 'Please provide an academic year']
    },
    term: {
        type: String,
        required: [true, 'Please provide a term']
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
    // Weekly timetable structure
    weeklyTimetable: {
        monday: [{
            period: {
                type: Number,
                required: [true, 'Period number is required'],
                min: [1, 'Period number must be at least 1'],
                max: [15, 'Period number cannot exceed 15']
            },
            gradeSubject: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'GradeSubject'
            },
            // Keep these for backward compatibility and break periods
            subject: {
                type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String
                ref: 'Subject'
            },
            teacher: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Teacher'
            },
            startTime: {
                type: String,
                required: [true, 'Start time is required'],
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            endTime: {
                type: String,
                required: [true, 'End time is required'],
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            duration: {
                type: Number,
                required: [true, 'Duration is required'],
                min: [15, 'Duration must be at least 15 minutes'],
                max: [120, 'Duration cannot exceed 120 minutes']
            },
            room: {
                type: String,
                trim: true
            },
            isBreak: {
                type: Boolean,
                default: false
            },
            breakType: {
                type: String,
                enum: ['lunch', 'short', 'assembly']
            },
            breakName: {
                type: String,
                trim: true
            }
        }],
        tuesday: [{
            period: {
                type: Number,
                required: [true, 'Period number is required'],
                min: [1, 'Period number must be at least 1'],
                max: [15, 'Period number cannot exceed 15']
            },
            gradeSubject: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'GradeSubject'
            },
            // Keep these for backward compatibility and break periods
            subject: {
                type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String
                ref: 'Subject'
            },
            teacher: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Teacher'
            },
            startTime: {
                type: String,
                required: [true, 'Start time is required'],
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            endTime: {
                type: String,
                required: [true, 'End time is required'],
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            duration: {
                type: Number,
                required: [true, 'Duration is required'],
                min: [15, 'Duration must be at least 15 minutes'],
                max: [120, 'Duration cannot exceed 120 minutes']
            },
            room: {
                type: String,
                trim: true
            },
            isBreak: {
                type: Boolean,
                default: false
            },
            breakType: {
                type: String,
                enum: ['lunch', 'short', 'assembly']
            },
            breakName: {
                type: String,
                trim: true
            }
        }],
        wednesday: [{
            period: {
                type: Number,
                required: [true, 'Period number is required'],
                min: [1, 'Period number must be at least 1'],
                max: [15, 'Period number cannot exceed 15']
            },
            gradeSubject: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'GradeSubject'
            },
            // Keep these for backward compatibility and break periods
            subject: {
                type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String
                ref: 'Subject'
            },
            teacher: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Teacher'
            },
            startTime: {
                type: String,
                required: [true, 'Start time is required'],
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            endTime: {
                type: String,
                required: [true, 'End time is required'],
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            duration: {
                type: Number,
                required: [true, 'Duration is required'],
                min: [15, 'Duration must be at least 15 minutes'],
                max: [120, 'Duration cannot exceed 120 minutes']
            },
            room: {
                type: String,
                trim: true
            },
            isBreak: {
                type: Boolean,
                default: false
            },
            breakType: {
                type: String,
                enum: ['lunch', 'short', 'assembly']
            },
            breakName: {
                type: String,
                trim: true
            }
        }],
        thursday: [{
            period: {
                type: Number,
                required: [true, 'Period number is required'],
                min: [1, 'Period number must be at least 1'],
                max: [15, 'Period number cannot exceed 15']
            },
            gradeSubject: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'GradeSubject'
            },
            // Keep these for backward compatibility and break periods
            subject: {
                type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String
                ref: 'Subject'
            },
            teacher: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Teacher'
            },
            startTime: {
                type: String,
                required: [true, 'Start time is required'],
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            endTime: {
                type: String,
                required: [true, 'End time is required'],
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            duration: {
                type: Number,
                required: [true, 'Duration is required'],
                min: [15, 'Duration must be at least 15 minutes'],
                max: [120, 'Duration cannot exceed 120 minutes']
            },
            room: {
                type: String,
                trim: true
            },
            isBreak: {
                type: Boolean,
                default: false
            },
            breakType: {
                type: String,
                enum: ['lunch', 'short', 'assembly']
            },
            breakName: {
                type: String,
                trim: true
            }
        }],
        friday: [{
            period: {
                type: Number,
                required: [true, 'Period number is required'],
                min: [1, 'Period number must be at least 1'],
                max: [15, 'Period number cannot exceed 15']
            },
            gradeSubject: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'GradeSubject'
            },
            // Keep these for backward compatibility and break periods
            subject: {
                type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String
                ref: 'Subject'
            },
            teacher: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Teacher'
            },
            startTime: {
                type: String,
                required: [true, 'Start time is required'],
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            endTime: {
                type: String,
                required: [true, 'End time is required'],
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            duration: {
                type: Number,
                required: [true, 'Duration is required'],
                min: [15, 'Duration must be at least 15 minutes'],
                max: [120, 'Duration cannot exceed 120 minutes']
            },
            room: {
                type: String,
                trim: true
            },
            isBreak: {
                type: Boolean,
                default: false
            },
            breakType: {
                type: String,
                enum: ['lunch', 'short', 'assembly']
            },
            breakName: {
                type: String,
                trim: true
            }
        }],
        saturday: [{
            period: {
                type: Number,
                required: [true, 'Period number is required'],
                min: [1, 'Period number must be at least 1'],
                max: [15, 'Period number cannot exceed 15']
            },
            gradeSubject: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'GradeSubject'
            },
            // Keep these for backward compatibility and break periods
            subject: {
                type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String
                ref: 'Subject'
            },
            teacher: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Teacher'
            },
            startTime: {
                type: String,
                required: [true, 'Start time is required'],
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            endTime: {
                type: String,
                required: [true, 'End time is required'],
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            duration: {
                type: Number,
                required: [true, 'Duration is required'],
                min: [15, 'Duration must be at least 15 minutes'],
                max: [120, 'Duration cannot exceed 120 minutes']
            },
            room: {
                type: String,
                trim: true
            },
            isBreak: {
                type: Boolean,
                default: false
            },
            breakType: {
                type: String,
                enum: ['lunch', 'short', 'assembly']
            },
            breakName: {
                type: String,
                trim: true
            }
        }],
        sunday: [{
            period: {
                type: Number,
                required: [true, 'Period number is required'],
                min: [1, 'Period number must be at least 1'],
                max: [15, 'Period number cannot exceed 15']
            },
            gradeSubject: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'GradeSubject'
            },
            // Keep these for backward compatibility and break periods
            subject: {
                type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String
                ref: 'Subject'
            },
            teacher: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Teacher'
            },
            startTime: {
                type: String,
                required: [true, 'Start time is required'],
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            endTime: {
                type: String,
                required: [true, 'End time is required'],
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            duration: {
                type: Number,
                required: [true, 'Duration is required'],
                min: [15, 'Duration must be at least 15 minutes'],
                max: [120, 'Duration cannot exceed 120 minutes']
            },
            room: {
                type: String,
                trim: true
            },
            isBreak: {
                type: Boolean,
                default: false
            },
            breakType: {
                type: String,
                enum: ['lunch', 'short', 'assembly']
            },
            breakName: {
                type: String,
                trim: true
            }
        }]
    },
    // Additional metadata
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
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
    notes: {
        type: String,
        trim: true
    }
}, { 
    timestamps: true 
});

// Compound unique index to ensure one timetable per grade/gender/section/academic year/term combination
timetableSchema.index(
    { academicYear: 1, term: 1, grade: 1, gender: 1, section: 1 },
    { unique: true }
);

// Validation to ensure no overlapping periods for the same day
timetableSchema.pre('save', function(next) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of days) {
        const dayTimetable = this.weeklyTimetable[day];
        if (dayTimetable && dayTimetable.length > 0) {
            // Sort by start time
            dayTimetable.sort((a, b) => a.startTime.localeCompare(b.startTime));
            
            // Check for overlapping periods
            for (let i = 0; i < dayTimetable.length - 1; i++) {
                const currentEnd = dayTimetable[i].endTime;
                const nextStart = dayTimetable[i + 1].startTime;
                
                if (currentEnd > nextStart) {
                    return next(new Error(`Overlapping periods detected on ${day}: Period ${dayTimetable[i].period} ends at ${currentEnd} but period ${dayTimetable[i + 1].period} starts at ${nextStart}`));
                }
            }
        }
    }
    next();
});

// Handling duplicate errors
timetableSchema.post('save', function(error, doc, next) {
    if (error.name === 'ValidationError') {
        next(new Error(`Validation Error: ${error.message}`));
    } else if (error.code === 11000) {
        next(new Error('A timetable already exists for this grade, gender, section, academic year and term combination'));
    } else {
        next(error);
    }
});

const Timetable = mongoose.model('Timetable', timetableSchema);

module.exports = Timetable;
