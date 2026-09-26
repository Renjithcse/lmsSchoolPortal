const mongoose = require('mongoose');

const groupSubjectSchema = new mongoose.Schema({
    academicYear: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: [true, 'Academic year is required'],
    },
    grade:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grade',
        required: [true, 'Grade is required'],
    },
    gender:{
        type: String,
        enum: ['male', 'female'],
        required: [true, 'Gender is required'],
    },
    section:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: [true, 'Please provide a section']
    },
    groupName: {
        type: String,
        required: [true, 'Group name is required'],
        trim: true
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
    }],
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
});

const GroupSubject = mongoose.model('GroupSubject', groupSubjectSchema);

module.exports = GroupSubject;
