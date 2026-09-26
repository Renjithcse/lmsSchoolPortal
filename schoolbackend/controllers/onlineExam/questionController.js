const Question = require('../../models/OnlineExam/Question');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const fs = require("fs");
const path = require("path");
const Publish = require('../../models/OnlineExam/Publish');
const crypto = require('crypto');
const s3 = require('../../utils/s3Client');

// Helper function to upload base64 image to S3
const uploadBase64ImageToS3 = async (base64String, folder = 'online_exam') => {
    try {
        // Extract base64 string after the comma
        const matches = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 image format');
        }

        const imageType = matches[1]; // e.g., "png" or "jpeg"
        const imageData = matches[2]; // Actual base64 string

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(6).toString('hex');
        const fileName = `image-${timestamp}-${randomString}.${imageType}`;
        const key = `${folder}/${fileName}`;

        // Decode base64 to buffer
        const buffer = Buffer.from(imageData, "base64");

        // Upload to S3
        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: `image/${imageType}`
            // ACL removed - bucket should have public read policy instead
        };

        const result = await s3.upload(uploadParams).promise();

        return {
            url: result.Location,
            key: key,
            fileName: fileName,
            originalType: imageType,
            size: buffer.length
        };
    } catch (error) {
        throw new Error(`S3 upload failed: ${error.message}`);
    }
};

// Helper function to delete S3 file
const deleteS3File = async (fileKey) => {
    try {
        const deleteParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileKey
        };
        
        await s3.deleteObject(deleteParams).promise();
        return true;
    } catch (error) {
        throw new Error(`Failed to delete S3 file: ${error.message}`);
    }
};

// Get all questions for a question bank
exports.getAllQuestions = catchAsync(async (req, res, next) => {
    const questions = await Question.find({ questionBank: req.query.questionBankId });

    res.status(200).json({
        status: 'success',
        results: questions.length,
        data: {
            questions,
        },
    });
});

// Create a new question
exports.createQuestion = catchAsync(async (req, res, next) => {


    const { questionBank, questionType, questionText, questionImage, options, correctAnswer, marks } = req.body;
    let questionImageData = null;

    // Upload question image to S3 if valid
    if (questionImage && questionImage.includes('data:image')) {
        try {
            questionImageData = await uploadBase64ImageToS3(questionImage, 'online_exam');
        } catch (error) {
            return next(new AppError(`Failed to upload question image: ${error.message}`, 400));
        }
    }

    if (questionType === 'objective') {

        if (!options || options.length === 0) {
            return next(new AppError('Options are required for objective type questions', 400));
        }

        if (!correctAnswer) {
            return next(new AppError('Correct answer is required for objective type questions', 400));
        }

        // Convert option letter (A, B, C, D) to index
        const optionIndex = correctAnswer.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        const correctOption = options[optionIndex];

        if (!correctOption) {
            return next(new AppError('Correct answer option is not valid', 400));
        }

        // Store the option letter (A, B, C, D) as correct answer
        let correctAnswers = correctAnswer;

        // Iterate each option and upload base64 images to S3
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            if (option?.type === "image" && option.value && option.value.includes('data:image')) {
                try {
                    const imageData = await uploadBase64ImageToS3(option.value, 'online_exam');
                    option.value = imageData.url; // Store S3 URL
                    option.s3Key = imageData.key; // Store S3 key for deletion
                } catch (error) {
                    return next(new AppError(`Failed to upload option image: ${error.message}`, 400));
                }
            }
        }


        

        // Insert into database
        const newQuestion = await Question.create({
            questionBank,
            questionType,
            questionText,
            questionImage: questionImageData ? questionImageData.url : null,
            questionImageS3Key: questionImageData ? questionImageData.key : null,
            options,
            correctAnswer: correctAnswers,
            marks,
        });

        res.status(201).json({
            status: 'success',
            data: {
                question: newQuestion,
            },
        });
    }
    else{
        const newQuestion = await Question.create({
            questionBank,
            questionType,
            questionText,
            questionImage: questionImageData ? questionImageData.url : null,
            questionImageS3Key: questionImageData ? questionImageData.key : null,
            correctAnswer,
            marks,
        });

        res.status(201).json({
            status: 'success',
            data: {
                question: newQuestion,
            },
        });
    }
    // const newQuestion = await Question.create({
    //     questionBank: req.body.questionBank,
    //     questionType: req.body.questionType,
    //     questionText: req.body.questionText,
    //     questionImage: req.body.questionImage,
    //     options: req.body.options, // Array of options without isCorrect
    //     correctAnswer: req.body.correctAnswer, // Separate correct answer field
    //     marks: req.body.marks,
    // });


});

exports.updateQuestion = catchAsync(async (req, res, next) => {
    const questionId = req.params.id;
    const { questionType, questionText, questionImage, options, correctAnswer, marks } = req.body;

    // Get the existing question first
    const existingQuestion = await Question.findById(questionId);
    if (!existingQuestion) {
        return next(new AppError('No question found with that ID', 404));
    }

    let questionImageData = null;
    let updatedOptions = options;

    // Handle question image update
    if (questionImage && questionImage.includes('data:image')) {
        try {
            questionImageData = await uploadBase64ImageToS3(questionImage, 'online_exam');
            
            // Delete old question image from S3 if it exists
            if (existingQuestion.questionImageS3Key) {
                try {
                    await deleteS3File(existingQuestion.questionImageS3Key);
                    console.log(`Successfully deleted old question image: ${existingQuestion.questionImageS3Key}`);
                } catch (error) {
                    console.error('Error deleting old question image:', error);
                }
            }
        } catch (error) {
            return next(new AppError(`Failed to upload question image: ${error.message}`, 400));
        }
    }

    // Handle option images update
    if (options && options.length > 0) {
        updatedOptions = [...options]; // Create a copy
        
        for (let i = 0; i < updatedOptions.length; i++) {
            const option = updatedOptions[i];
            if (option?.type === "image" && option.value && option.value.includes('data:image')) {
                try {
                    const imageData = await uploadBase64ImageToS3(option.value, 'online_exam');
                    option.value = imageData.url; // Store S3 URL
                    option.s3Key = imageData.key; // Store S3 key for deletion
                } catch (error) {
                    return next(new AppError(`Failed to upload option image: ${error.message}`, 400));
                }
            }
        }
    }

    // Update the question
    const updatedQuestion = await Question.findByIdAndUpdate(
        questionId,
        {
            questionType,
            questionText,
            questionImage: questionImageData ? questionImageData.url : existingQuestion.questionImage,
            questionImageS3Key: questionImageData ? questionImageData.key : existingQuestion.questionImageS3Key,
            options: updatedOptions || existingQuestion.options,
            correctAnswer,
            marks,
        },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        status: 'success',
        data: {
            question: updatedQuestion,
        },
    });
});

// Delete a question
exports.deleteQuestion = catchAsync(async (req, res, next) => {
    const questionId = req.params.id;

    // First, check if the question exists
    const question = await Question.findById(questionId);
    if (!question) {
        return next(new AppError('No question found with that ID', 404));
    }

    // Check if the question's question bank is being used in any published exams
    
    const publishes = await Publish.find({ questionBank: question.questionBank });

    if (publishes.length > 0) {
        return next(new AppError(
            `Cannot delete question. This question belongs to a question bank that is being used in ${publishes.length} published exam(s). Please delete the published exams first.`, 
            400
        ));
    }

    // Delete associated images from S3 before deleting the question
    try {
        // Delete question image from S3
        if (question.questionImageS3Key) {
            await deleteS3File(question.questionImageS3Key);
            console.log(`Successfully deleted question image: ${question.questionImageS3Key}`);
        }

        // Delete option images from S3
        if (question.options && question.options.length > 0) {
            for (const option of question.options) {
                if (option.s3Key) {
                    await deleteS3File(option.s3Key);
                    console.log(`Successfully deleted option image: ${option.s3Key}`);
                }
            }
        }
    } catch (error) {
        console.error('Error deleting S3 images:', error);
        // Continue with question deletion even if S3 deletion fails
    }

    // If no publishes exist using this question bank, proceed with deletion
    await Question.findByIdAndDelete(questionId);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});
