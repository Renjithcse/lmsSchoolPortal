const OnlineExam = require('../../models/OnlineExam/OnlineExam');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const Publish = require('../../models/OnlineExam/Publish');
const QuestionBank = require('../../models/OnlineExam/QuestionBank');
const Settings = require('../../models/Admin/Settings');

// Get all online exams with filters and population
exports.getAllExams = catchAsync(async (req, res, next) => {
    const { academicYear, term, grade, subjectId } = req.query;

    // Build the query object for filtering
    const filter = {};
    if (academicYear) filter.academicYear = academicYear;
    if (term) filter.term = term;
    if (grade) filter.grade = grade;
    if (subjectId) filter.subjectId = subjectId;

    if (!academicYear || !term) {
        const settings = await Settings.findOne().select('academicYear term');
        if (settings) {
            if (!academicYear && settings.academicYear) {
                filter.academicYear = settings.academicYear;
            }
            if (!term && settings.term) {
                filter.term = settings.term;
            }
        }
    }

    // Find exams based on the filter and populate the related models
    const exams = await OnlineExam.find(filter)
        .populate({
            path: 'academicYear',
            select: 'academicYear', // Adjust the field(s) you want to select from the academicYear model
        })
        .populate({
            path: 'grade',
            select: 'gradeName', // Adjust the field(s) you want to select from the grade model
        })
        .populate({
            path: 'subjectId',
            select: 'subjectName', // Adjust the field(s) you want to select from the subject model
        })
        .populate({
            path: 'createdBy',
            select: 'name', // Adjust the field(s) you want to select from the user model
        })
        .populate('publishCount')

    res.status(200).json({
        status: 'success',
        results: exams.length,
        data: {
            exams,
        },
    });
});

// Get a single exam by ID, including populated fields
exports.getExam = catchAsync(async (req, res, next) => {



    const exam = await OnlineExam.findOne({slug: req.params.id})
        .populate({
            path: 'academicYear',
            select: 'academicYear', // Adjust the field(s) you want to select from the academicYear model
        })
        .populate({
            path: 'grade',
            select: 'gradeName', // Adjust the field(s) you want to select from the grade model
        })
        .populate({
            path: 'subjectId',
            select: 'subjectName', // Adjust the field(s) you want to select from the subject model
        })
        .populate('publishCount');

    if (!exam) {
        return next(new AppError('No exam found with that ID', 404));
    }


    

    res.status(200).json({
        status: 'success',
        data: {
            exam
        },
    });
});

// Create a new exam
exports.createExam = catchAsync(async (req, res, next) => {

    if (!req.body.academicYear || !req.body.term) {
        const settings = await Settings.findOne().select('academicYear term');
        if (settings) {
            req.body.academicYear = settings.academicYear;
            req.body.term = settings.term;
        }
    }

    try {
        const newExam = await OnlineExam.create({
            examName: req.body.examName,
            academicYear: req.body.academicYear,
            grade:req.body.grade,
            term: req.body.term,
            subjectId: req.body.subjectId,
            createdBy: req.user.id,
        });

        res.status(201).json({
            status: 'success',
            data: {
                exam: newExam,
            },
        });
    } catch (err) {
        if (err.code === 11000) {
            return next(new AppError('An exam with the same name already exists for the given academic year, grade, term, and subject', 400));
        }
        return next(err);
    }
});

// Update an existing exam
exports.updateExam = catchAsync(async (req, res, next) => {
    const updatedExam = await OnlineExam.findByIdAndUpdate(
        req.params.id,
        {
            ...req.body,
            updatedBy: req.user.id,
        },
        {
            new: true,
            runValidators: true,
        }
    )
        .populate({
            path: 'academicYear',
            select: 'academicYear', // Adjust the field(s) you want to select from the academicYear model
        })
        .populate({
            path: 'grade',
            select: 'gradeName', // Adjust the field(s) you want to select from the grade model
        })
        .populate({
            path: 'subjectId',
            select: 'subjectName', // Adjust the field(s) you want to select from the subject model
        });

    if (!updatedExam) {
        return next(new AppError('No exam found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            exam: updatedExam,
        },
    });
});

// Delete an exam by ID
exports.deleteExam = catchAsync(async (req, res, next) => {
    const examId = req.params.id;

    // First, check if the exam exists
    const exam = await OnlineExam.findById(examId);
    if (!exam) {
        return next(new AppError('No exam found with that ID', 404));
    }

    // Check if there are any question banks associated with this exam
    
    const questionBanks = await QuestionBank.find({ exam: examId });

    if (questionBanks.length > 0) {
        return next(new AppError(
            `Cannot delete exam. This exam has ${questionBanks.length} question bank(s) associated with it. Please delete the question banks first.`, 
            400
        ));
    }

    // If no question banks exist, proceed with deletion
    await OnlineExam.findByIdAndDelete(examId);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});
