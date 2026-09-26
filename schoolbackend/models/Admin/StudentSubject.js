const mongoose = require('mongoose');

const studentSubjectSchema = new mongoose.Schema({
    academicYear: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: [true, 'Please provide an academic year']
    },
    grade:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grade',
        required: [true, 'Please provide a grade']
    },
    gender:{
        type: String,
        enum: ['male', 'female'],
        required: [true, 'Please provide a gender']
    },
    section:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: [true, 'Please provide a section']
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: [true, 'Please provide a subject']
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'Please provide a student ID'],
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: true });

// Compound unique index to prevent duplicate student under the same GradeSubjectId
studentSubjectSchema.index({ academicYear: 1, grade:1, gender: 1, section:1, subject: 1, studentId: 1 }, { unique: true });

const StudentSubject = mongoose.model('StudentSubject', studentSubjectSchema);

module.exports = StudentSubject;