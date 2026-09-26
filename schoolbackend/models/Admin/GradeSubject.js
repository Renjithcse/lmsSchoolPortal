const { subject } = require('@casl/ability');
const mongoose = require('mongoose');

const gradeSubjectSchema = new mongoose.Schema({
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
    type: {
        type: String,
        enum: ['common', 'group', 'optional', 'grade'],
        required: [true, 'Please provide a type']
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    Status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
});

// Enforce uniqueness for the same subject within the same academicYear + grade + gender + section
// Do NOT include teacher or Status so duplicates are prevented regardless of teacher assignment/status
gradeSubjectSchema.index(
    { academicYear: 1, grade: 1, gender: 1, section: 1, subject: 1 },
    { unique: true, name: 'uniq_academic_grade_gender_section_subject' }
);

// Handling duplicate errors or validation errors
gradeSubjectSchema.post('save', function(error, doc, next) {
    if (error.name === 'ValidationError') {
        next(new Error(`Validation Error: ${error.message}`));
    } else {
        next(error);
    }
});

const GradeSubject = mongoose.model('GradeSubject', gradeSubjectSchema);

module.exports = GradeSubject;
