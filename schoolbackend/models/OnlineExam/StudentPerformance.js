const mongoose = require('mongoose');

const studentPerformanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Student',
        required: [true, 'Student ID is required'],
    },
    examId: {
        type: mongoose.Schema.ObjectId,
        ref: 'OnlineExam',
        required: [true, 'Exam ID is required'],
    },
    bestMarkSecured: {
        type: Number,
    },
    attempts: {
        type: Number,
    },
    totalMarksArray: [
        {
            publishId: {
                type: mongoose.Schema.ObjectId,
                ref: 'Publish',
            },
            marks: {
                type: Number,
            },
        }
    ],
}, {
    timestamps: true,
});

// Enforce a unique combination of studentId and examId
studentPerformanceSchema.index({ studentId: 1, examId: 1 }, { unique: true });

const StudentPerformance = mongoose.model('StudentPerformance', studentPerformanceSchema);
module.exports = StudentPerformance;
