const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    academicYear: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: [true, 'Please provide an academic year']
    },
    term: {
        type: String,
        required: [true, 'Please provide a term']
    },
    // Library settings
    librarySettings: {
        maxBooksForStudent: {
            type: Number,
            default: 3,
            min: [1, 'Maximum books for student must be at least 1']
        },
        maxBooksForTeacher: {
            type: Number,
            default: 5,
            min: [1, 'Maximum books for teacher must be at least 1']
        },
        bookIssueDuration: {
            type: Number,
            default: 14,
            min: [1, 'Book issue duration must be at least 1 day']
        },
        maxRenewals: {
            type: Number,
            default: 2,
            min: [0, 'Maximum renewals cannot be negative']
        },
        finePerDay: {
            type: Number,
            default: 1,
            min: [0, 'Fine per day cannot be negative']
        },
        gracePeriod: {
            type: Number,
            default: 3,
            min: [0, 'Grace period cannot be negative']
        }
    },
    // School timing settings
    schoolTimings: {
        // Default/Overall school timings
        default: {
            startTime: {
                type: String,
                default: "08:00",
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            endTime: {
                type: String,
                default: "15:00",
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            lunchStartTime: {
                type: String,
                default: "12:00",
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            lunchEndTime: {
                type: String,
                default: "13:00",
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            totalHours: {
                type: Number,
                default: 7,
                min: [1, 'Total hours must be at least 1'],
                max: [12, 'Total hours cannot exceed 12']
            },
            periodDuration: {
                type: Number,
                default: 45,
                min: [15, 'Period duration must be at least 15 minutes'],
                max: [120, 'Period duration cannot exceed 120 minutes']
            },
            totalPeriods: {
                type: Number,
                default: 8,
                min: [1, 'Total periods must be at least 1'],
                max: [15, 'Total periods cannot exceed 15']
            },
            breaks: [{
                name: {
                    type: String,
                    required: [true, 'Break name is required']
                },
                startTime: {
                    type: String,
                    required: [true, 'Break start time is required'],
                    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
                },
                endTime: {
                    type: String,
                    required: [true, 'Break end time is required'],
                    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
                },
                duration: {
                    type: Number,
                    required: [true, 'Break duration is required'],
                    min: [1, 'Break duration must be at least 1 minute']
                }
            }]
        },
        // Grade-specific overrides
        gradeOverrides: [{
            grade: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Grade',
                required: [true, 'Grade is required for override']
            },
            startTime: {
                type: String,
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            endTime: {
                type: String,
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            lunchStartTime: {
                type: String,
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            lunchEndTime: {
                type: String,
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            totalHours: {
                type: Number,
                min: [1, 'Total hours must be at least 1'],
                max: [12, 'Total hours cannot exceed 12']
            },
            periodDuration: {
                type: Number,
                min: [15, 'Period duration must be at least 15 minutes'],
                max: [120, 'Period duration cannot exceed 120 minutes']
            },
            totalPeriods: {
                type: Number,
                min: [1, 'Total periods must be at least 1'],
                max: [15, 'Total periods cannot exceed 15']
            },
            breaks: [{
                name: {
                    type: String,
                    required: [true, 'Break name is required']
                },
                startTime: {
                    type: String,
                    required: [true, 'Break start time is required'],
                    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
                },
                endTime: {
                    type: String,
                    required: [true, 'Break end time is required'],
                    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
                },
                duration: {
                    type: Number,
                    required: [true, 'Break duration is required'],
                    min: [1, 'Break duration must be at least 1 minute']
                }
            }]
        }],
        // Gender-specific overrides
        genderOverrides: [{
            gender: {
                type: String,
                enum: ['male', 'female'],
                required: [true, 'Gender is required for override']
            },
            startTime: {
                type: String,
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            endTime: {
                type: String,
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            lunchStartTime: {
                type: String,
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            lunchEndTime: {
                type: String,
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            totalHours: {
                type: Number,
                min: [1, 'Total hours must be at least 1'],
                max: [12, 'Total hours cannot exceed 12']
            },
            periodDuration: {
                type: Number,
                min: [15, 'Period duration must be at least 15 minutes'],
                max: [120, 'Period duration cannot exceed 120 minutes']
            },
            totalPeriods: {
                type: Number,
                min: [1, 'Total periods must be at least 1'],
                max: [15, 'Total periods cannot exceed 15']
            },
            breaks: [{
                name: {
                    type: String,
                    required: [true, 'Break name is required']
                },
                startTime: {
                    type: String,
                    required: [true, 'Break start time is required'],
                    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
                },
                endTime: {
                    type: String,
                    required: [true, 'Break end time is required'],
                    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
                },
                duration: {
                    type: Number,
                    required: [true, 'Break duration is required'],
                    min: [1, 'Break duration must be at least 1 minute']
                }
            }]
        }],
        // Grade and Gender combined overrides (highest priority)
        gradeGenderOverrides: [{
            grade: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Grade',
                required: [true, 'Grade is required for override']
            },
            gender: {
                type: String,
                enum: ['male', 'female'],
                required: [true, 'Gender is required for override']
            },
            startTime: {
                type: String,
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            endTime: {
                type: String,
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            lunchStartTime: {
                type: String,
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            lunchEndTime: {
                type: String,
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
            },
            totalHours: {
                type: Number,
                min: [1, 'Total hours must be at least 1'],
                max: [12, 'Total hours cannot exceed 12']
            },
            periodDuration: {
                type: Number,
                min: [15, 'Period duration must be at least 15 minutes'],
                max: [120, 'Period duration cannot exceed 120 minutes']
            },
            totalPeriods: {
                type: Number,
                min: [1, 'Total periods must be at least 1'],
                max: [15, 'Total periods cannot exceed 15']
            },
            breaks: [{
                name: {
                    type: String,
                    required: [true, 'Break name is required']
                },
                startTime: {
                    type: String,
                    required: [true, 'Break start time is required'],
                    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
                },
                endTime: {
                    type: String,
                    required: [true, 'Break end time is required'],
                    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
                },
                duration: {
                    type: Number,
                    required: [true, 'Break duration is required'],
                    min: [1, 'Break duration must be at least 1 minute']
                }
            }]
        }]
    },
    // Attendance settings
    attendanceSettings: {
        modificationTime: {
            type: String,
            default: "23:59",
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
        }
    }
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
