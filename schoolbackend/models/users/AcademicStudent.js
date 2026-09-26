const mongoose = require('mongoose');

const AcademicStudentSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Student', 
        required: [true, "Student Id Required"] 
    },
    academicYear: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'AcademicYear', 
        required: [true, "Please provide an academic year"] 
    },
    grade:{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Grade', 
        required: [true, "Please provide a grade"] 
    },
    gender:{ 
        type: String, 
        required: [true, "Please provide a gender"], 
        enum: {
            values: ['male', 'female'],
            message: 'Gender must be either Male or Female'
        } 
    },
    section:{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: [true, 'Please provide a section']
    },
    startDate: { 
        type: Date, 
        required: [true, "Please provide a start date"] ,
        default: Date.now
    },
    endDate: { 
        type: Date 
    },
    status: { 
        type: String, 
        required: [true, "Please provide a status"], 
        enum: {
            values: ['active', 'promoted', 'inactive', 'completed'],
            message: 'Status must be either active, promoted, inactive, or completed'
        },
        default: 'active'
    },
}, { timestamps: true });

const AcademicStudent = mongoose.model('AcademicStudent', AcademicStudentSchema);

module.exports = AcademicStudent;
