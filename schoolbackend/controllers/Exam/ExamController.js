const { Exam, Category, SubCategory, StudentMarks } = require('../../models/MarkEntry/Mark');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');

// Get all online exams with filters and population
exports.getAllExams = catchAsync(async (req, res, next) => {
    // Find exams based on the filter and populate the related models
    const exams = await Exam.find(req.query);

    res.status(200).json({
        status: 'success',
        results: exams.length,
        data: exams
    });
});

//Create a new exam
exports.createExam = catchAsync(async (req, res, next) => {
    try {
        const exam = await Exam.create(req.body);
        res.status(201).json({
            status:'success',
            data: {
                exam
            }
        });
        
    } catch (error) {
        return next(new AppError('Invalid input', 400));
    }
});



//Update an existing exam
exports.updateExam = catchAsync(async (req, res, next) => {
    try {
        const updatedExam = await Exam.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});
        if(!updatedExam) return next(new AppError('No exam found with that ID', 404));
        res.status(200).json({
            status: 'success',
            data: {
                exam: updatedExam
            }
        });
    } catch (error) {
        if(error.name === 'ValidationError') return next(new AppError(error.message, 400));
        return next(error);
    }
});

//Delete an exam by ID
exports.deleteExam = catchAsync(async (req, res, next) => {
    const examId = req.params.id;

    // First, check if the exam exists
    const exam = await Exam.findById(examId);
    if(!exam) {
        return next(new AppError('No exam found with that ID', 404));
    }

    // Check if the exam is being used in Category model
    const categories = await Category.find({ examName: exam.examName });
    if (categories.length > 0) {
        return next(new AppError(
            `Cannot delete exam. This exam is being used by ${categories.length} category record(s). Please delete the categories first.`, 
            400
        ));
    }

    // Check if the exam is being used in SubCategory model
    const subCategories = await SubCategory.find({ examName: examId });
    if (subCategories.length > 0) {
        return next(new AppError(
            `Cannot delete exam. This exam is being used by ${subCategories.length} sub-category record(s). Please delete the sub-categories first.`, 
            400
        ));
    }

    // Check if the exam is being used in StudentMarks model
    const studentMarks = await StudentMarks.find({ examName: examId });
    if (studentMarks.length > 0) {
        return next(new AppError(
            `Cannot delete exam. This exam is being used by ${studentMarks.length} student mark record(s). Please delete the student marks first.`, 
            400
        ));
    }

    // If no dependencies exist, proceed with deletion
    await Exam.findByIdAndDelete(examId);

    res.status(204).json({
        status: 'success',
        data: null
    });
});