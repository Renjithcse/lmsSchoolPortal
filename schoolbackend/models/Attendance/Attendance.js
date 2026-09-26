const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    // Basic Information
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: function() { return this.attendanceType === 'student'; }
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: function() { return this.attendanceType === 'teacher'; }
    },
    attendanceType: {
        type: String,
        enum: ['student', 'teacher'],
        required: true
    },
    
    // Date and Time
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    timeIn: {
        type: Date,
        required: true
    },
    timeOut: {
        type: Date
    },
    
    // Attendance Method
    attendanceMethod: {
        type: String,
        enum: ['biometric', 'rfid', 'mobile', 'web', 'manual'],
        required: true
    },
    
    // Status
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'half-day', 'leave'],
        default: 'present'
    },
    
    // Location (for mobile attendance)
    location: {
        latitude: Number,
        longitude: Number,
        address: String
    },
    
    // Device Information
    deviceInfo: {
        deviceId: String,
        deviceType: String, // biometric, rfid, mobile, web
        ipAddress: String,
        userAgent: String
    },
    
    // Academic Context
    academicYear: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: true
    },
    grade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grade',
        required: function() { return this.attendanceType === 'student'; }
    },
    
    // Notes and Remarks
    notes: {
        type: String,
        trim: true
    },
    remarks: {
        type: String,
        trim: true
    },
    
    // Verification
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: {
        type: Date
    },
    
    // Timestamps
    isActive: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
attendanceSchema.index({ date: 1, attendanceType: 1 });
attendanceSchema.index({ student: 1, date: 1 });
attendanceSchema.index({ teacher: 1, date: 1 });
attendanceSchema.index({ academicYear: 1, grade: 1, date: 1 });
attendanceSchema.index({ attendanceMethod: 1, date: 1 });

// Virtual for duration
attendanceSchema.virtual('duration').get(function() {
    if (this.timeIn && this.timeOut) {
        return Math.round((this.timeOut - this.timeIn) / (1000 * 60 * 60)); // hours
    }
    return null;
});

// Virtual for isLate
attendanceSchema.virtual('isLate').get(function() {
    if (this.timeIn) {
        const timeIn = new Date(this.timeIn);
        const expectedTime = new Date(this.date);
        expectedTime.setHours(8, 0, 0, 0); // Assuming 8 AM is expected time
        return timeIn > expectedTime;
    }
    return false;
});

// Pre-save middleware to set default timeIn if not provided
attendanceSchema.pre('save', function(next) {
    if (!this.timeIn) {
        this.timeIn = new Date();
    }
    next();
});

// Static method to get attendance statistics
attendanceSchema.statics.getAttendanceStats = async function(filters = {}) {
    const pipeline = [
        { $match: { ...filters, isActive: true } },
        {
            $group: {
                _id: {
                    date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    status: "$status"
                },
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: "$_id.date",
                statuses: {
                    $push: {
                        status: "$_id.status",
                        count: "$count"
                    }
                },
                total: { $sum: "$count" }
            }
        },
        { $sort: { _id: -1 } }
    ];
    
    return this.aggregate(pipeline);
};

// Static method to get attendance by date range
attendanceSchema.statics.getAttendanceByDateRange = async function(startDate, endDate, filters = {}) {
    const query = {
        date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        },
        isActive: true,
        ...filters
    };
    
    return this.find(query)
        .populate('student', 'name rollNumber')
        .populate('teacher', 'name employeeId')
        .populate('academicYear', 'academicYear')
        .populate('grade', 'grade')
        .sort({ date: -1, timeIn: -1 });
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
