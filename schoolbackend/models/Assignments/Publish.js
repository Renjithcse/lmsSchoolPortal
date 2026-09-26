const mongoose = require('mongoose');

const publishAssignmentSchema = new mongoose.Schema({
    assignment: {
        type: mongoose.Schema.ObjectId,
        ref: 'Assignment',
        required: [true, 'Published Assignment must be linked to an exam'],
    },
    grade:{
        type: mongoose.Schema.ObjectId,
        ref: 'Grade',
        required: [true, 'Grade must be linked to a question bank'],
    },
    gender:{
        type: String,
        enum: ['male', 'female'], // Gender can be either 'boys' or 'girls'
        required: [true, 'Gender is required'],
    },
    section:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: [true, 'Please provide a section']
    },
    startDate: {
        type: Date,
        required: [true, 'Start date of the published exam is required'],
    },
    endDate: {
        type: Date,
        required: [true, 'End date of the published exam is required'],
    },
    totalUsersSelected: {
        type: Number,
        required: [true, 'Total number of users selected is required'],
    },
    attendedUsers: {
        type: Number,
        default: 0, // Initially, 0 attended users
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    updatedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

const PublishAssignment = mongoose.model('PublishAssignment', publishAssignmentSchema);
module.exports = PublishAssignment;
