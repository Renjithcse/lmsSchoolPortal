const mongoose = require('mongoose');

const studentAssignmentAttemptSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Student',
        required: [true, 'Student ID is required'],
    },
    publishId: {
        type: mongoose.Schema.ObjectId,
        ref: 'PublishAssignment',
        required: [true, 'Assignment Publish ID is required'],
    },
    attendedStatus: {
        type: Boolean,
        default: false,
    },
    attendedDate: {
        type: Date,
    },
    teacherRemarks: {
        type: String,
        default: '',
    },
    studentAnswer: {
        type: String,
        default: '',
    },
    studentAttachment: {
        type: String,
    },
    teacherId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Teacher',
    },
}, {
    timestamps: true,
});

const StudentAssignmentAttempt = mongoose.model('StudentAssignmentAttempt', studentAssignmentAttemptSchema);
module.exports = StudentAssignmentAttempt;
