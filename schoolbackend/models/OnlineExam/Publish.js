const mongoose = require('mongoose');

const publishSchema = new mongoose.Schema({
    exam: {
        type: mongoose.Schema.ObjectId,
        ref: 'OnlineExam',
        required: [true, 'Published exam must be linked to an exam'],
    },
    questionBank: {
        type: mongoose.Schema.ObjectId,
        ref: 'QuestionBank',
        required: [true, 'Published exam must be linked to a question bank'],
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
    numberOfQuestions: {
        type: Number,
        required: [true, 'Number of questions to publish is required'],
        validate: {
            validator: function (value) {
                return value <= this.totalQuestionsInBank;
            },
            message: 'Number of questions cannot exceed total questions in the question bank',
        },
    },
    duration: {
        type: Number, // Duration in seconds
        required: [true, 'Duration of the exam is required'],
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
    totalQuestionsInBank: {
        type: Number, // Total questions in the question bank
        required: [true, 'Total questions in the question bank must be provided'],
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

const Publish = mongoose.model('Publish', publishSchema);
module.exports = Publish;
