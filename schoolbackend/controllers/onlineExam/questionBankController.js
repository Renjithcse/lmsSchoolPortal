const QuestionBank = require('../../models/OnlineExam/QuestionBank');
const Question = require('../../models/OnlineExam/Question');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const Publish = require('../../models/OnlineExam/Publish');

// Get all question banks (for the main question bank screen)
exports.getAllQuestionBanksList = catchAsync(async (req, res, next) => {
    const { subjectId, gradeId } = req.query;

    // Determine which grade filter to use (gradeId takes precedence)
    const gradeFilter = gradeId;
    
    // Build query based on provided parameters
    const query = { status: 'active' };
    
    // Only apply subject filter if subjectId is provided
    if (subjectId && subjectId.trim() !== '') {
        query.subject = subjectId;
    }

    // Apply grade filter if supplied
    if (gradeFilter && String(gradeFilter).trim() !== '') {
        query.grades = gradeFilter;
    }
    
    // If user is admin, don't filter by createdBy (can see all question banks)
    // If user is not admin, only show question banks created by them
    if (req?.user?.role !== "admin") {
        query.createdBy = req.user.id;
    }

    const questionBanks = await QuestionBank.find(query)
        .populate("createdBy", "name")
        .populate("subject", "subjectName")
        .populate("grades", "gradeName")
        .sort({ createdAt: -1 });

    // Calculate the number of questions for each question bank
    const questionBanksWithCounts = await Promise.all(questionBanks.map(async (questionBank) => {
        const questionCount = await Question.countDocuments({ questionBank: questionBank._id });
        return {
            ...questionBank.toObject(),
            questionCount,
        };
    }));

    res.status(200).json({
        status: 'success',
        results: questionBanksWithCounts.length,
        data: {
            questionBanks: questionBanksWithCounts,
        },
    });
});


//View Single Question Bank
exports.viewQuestionBank = catchAsync(async (req, res, next) => {
    const questionBank = await QuestionBank.findById(req.params.id)
        .populate("createdBy", "name")
        .populate("subject", "subjectName")
        .populate("grades", "gradeName");

    if (!questionBank) {
        return next(new AppError('No question bank found with that ID', 404));
    }

    const questionCount = await Question.countDocuments({ questionBank: questionBank._id });

    const questions = await Question.find({ questionBank: questionBank._id });

    res.status(200).json({
        status: 'success',
        data: {
            questionBank: {
                ...questionBank.toObject(),
                questionCount,
                questions
            },
        },
    });
});

// Create a new question bank
exports.createQuestionBank = catchAsync(async (req, res, next) => {
    const newQuestionBank = await QuestionBank.create({
        subject: req.body.subject,
        questionBankName: req.body.questionBankName,
        grades: req.body.grades || [],
        createdBy: req.user._id,
    });

    res.status(201).json({
        status: 'success',
        data: {
            questionBank: newQuestionBank,
        },
    });
});

// Update a question bank
exports.updateQuestionBank = catchAsync(async (req, res, next) => {
    const updatedQuestionBank = await QuestionBank.findByIdAndUpdate(
        req.params.id,
        { 
            questionBankName: req.body.questionBankName, 
            grades: req.body.grades || [],
            updatedBy: req.user._id, 
            status: req.body.status 
        },
        { new: true, runValidators: true }
    );

    if (!updatedQuestionBank) {
        return next(new AppError('No question bank found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            questionBank: updatedQuestionBank,
        },
    });
});

// Delete a question bank only if no questions are associated with it and no publishes use it
exports.deleteQuestionBank = catchAsync(async (req, res, next) => {
    const questionBankId = req.params.id;

    // First, check if the question bank exists
    const questionBank = await QuestionBank.findById(questionBankId);
    if (!questionBank) {
        return next(new AppError('No question bank found with that ID', 404));
    }

    // Check if there are any questions associated with this question bank
    const questions = await Question.find({ questionBank: questionBankId });
    if (questions.length > 0) {
        return next(new AppError(
            `Cannot delete question bank. This question bank has ${questions.length} question(s) associated with it. Please delete the questions first.`, 
            400
        ));
    }

    // Check if there are any publishes using this question bank
    const publishes = await Publish.find({ questionBank: questionBankId });
    if (publishes.length > 0) {
        return next(new AppError(
            `Cannot delete question bank. This question bank is being used in ${publishes.length} published exam(s). Please delete the published exams first.`, 
            400
        ));
    }

    // If no questions and no publishes exist, proceed with deletion
    await QuestionBank.findByIdAndDelete(questionBankId);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});
