const mongoose = require('mongoose');

const subjectPermissionSchema = new mongoose.Schema({
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
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: [true, 'Please provide a subject']
    }],
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please provide a creator']
    }
}, { timestamps: true });

const SubjectPermission = mongoose.model('SubjectPermission', subjectPermissionSchema);

module.exports = SubjectPermission;
