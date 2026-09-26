const mongoose = require('mongoose');

const studentExamAttemptSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Student',
        required: [true, 'Student ID is required'],
    },
    publishId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Publish',
        required: [true, 'Publish ID is required'],
    },
    securedMark: {
        type: Number,
        default: 0,
    },
    attendedStatus: {
        type: Boolean,
        default: false,
    },
    totalQuestions: {
        type: Number,
        required: [true, 'Total number of questions is required'],
    },
    attendedDate: {
        type: Date,
    },
    teacherRemarks: {
        type: String,
        default: '',
    },
    studentAnswers: [
        {
            questionId: {
                type: mongoose.Schema.ObjectId,
                ref: 'Question',
            },
            studentAnswer: {
                type: String,
            },
        }
    ],
    teacherId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Teacher',
    },
}, {
    timestamps: true,
});

const StudentExamAttempt = mongoose.model('StudentExamAttempt', studentExamAttemptSchema);
module.exports = StudentExamAttempt;
