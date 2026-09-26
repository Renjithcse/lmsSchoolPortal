const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionBank: {
        type: mongoose.Schema.ObjectId,
        ref: 'QuestionBank',
        required: [true, 'Question must belong to a question bank'],
    },
    questionType: {
        type: String,
        enum: ['objective', 'fill-in-the-blanks', 'true/false'],
        required: [true, 'Question must have a type'],
    },
    questionText: {
        type: String,
        required: function () {
            return !this.questionImage; // Question text is required if no image
        },
    },
    questionImage: {
        type: String, // S3 URL to an image if any
    },
    questionImageS3Key: {
        type: String, // S3 key for deletion
    },
    options: {
        type: [
            {
                type: {
                    type: String,
                    required: [true, "Option must have a type"],
                },
                value: {
                    type: String, // S3 URL to an image for option
                    required: [true, "Option value is required"],
                },
                s3Key: {
                    type: String, // S3 key for deletion
                },
            },
        ],
        validate: {
            validator: function (value) {
                // Validate that options are only required for "objective" type
                if (this.questionType === "objective") {
                    return value && value.length > 0; // Options must be non-empty
                }
                // Options can be empty for other types
                return true;
            },
            message: "Options are required for 'objective' question type.",
        },
    },
    correctAnswer: {
        type: String, // For objective, this will store the correct option text or image
        required: [true, 'Correct answer is required'],
    },
    marks: {
        type: Number,
        required: [true, 'Question must have a mark'],
    },
}, {
    timestamps: true,
});

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;
