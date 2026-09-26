const mongoose = require('mongoose');

const GradePermissionSchema = new mongoose.Schema({
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
    gender:[
        {
            type: String,
            enum: ['male', 'female'],
            required: [true, 'Gender Required']
        }
    ],
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: [true, 'Please provide a teacher']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please provide a creator']
    }
});


const GradePermission = mongoose.model('GradePermission', GradePermissionSchema);

module.exports = GradePermission;
