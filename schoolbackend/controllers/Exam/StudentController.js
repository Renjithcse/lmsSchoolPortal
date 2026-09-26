const StudentMarks = require('../../models/MarkEntry/Mark').StudentMarks;
const Exam = require('../../models/MarkEntry/Mark').Exam;
const Category = require('../../models/MarkEntry/Mark').Category;
const AcademicStudent = require('../../models/users/AcademicStudent');
const Settings = require('../../models/Admin/Settings');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');

// Get student exam summary
exports.getStudentExamSummary = catchAsync(async (req, res, next) => {
    const studentId = req.studentId;
    if (!studentId) {
        return next(new AppError('Student ID not found in token', 401));
    }

    // Get current settings (academic year and term)
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }

    const academicYearId = currentSettings.academicYear._id;
    const term = currentSettings.term;

    // Get gradeId from current academic info
    const currentAcademic = await AcademicStudent.findOne({ 
        studentId: studentId,
        status: 'active'
    }).populate('academicYear grade');
    
    if (!currentAcademic) {
        return next(new AppError('Student academic information not found', 404));
    }

    const gradeId = currentAcademic.grade._id;

    // Get all exams for the student
    const studentMarks = await StudentMarks.find({
        studentId,
        academicYear: academicYearId,
        grade: gradeId,
        term
    }).populate([
        {
            path: 'subject',
            select: 'subjectName'
        },
        {
            path: 'grade',
            select: 'gradeName'
        },
        {
            path: 'academicYear',
            select: 'academicYear'
        },
        {
            path: 'examName',
            select: 'examName publishDate'
        }
    ]);

    // Filter marks based on publish date - only show if publish date is less than or equal to current date
    const currentDate = new Date();
    const filteredMarks = studentMarks.filter(mark => {
        if (!mark.examName || !mark.examName.publishDate) {
            return false; // Hide marks if exam or publish date is missing
        }
        const publishDate = new Date(mark.examName.publishDate);
        return publishDate <= currentDate;
    });

    // Group by exam name
    const exams = [];
    const examMap = new Map();

    filteredMarks.forEach(mark => {
        const examName = mark.examName?.examName || 'Unknown Exam';
        const examId = mark.examName?._id || null;
        const subjectId = mark.subject._id.toString();
        const subjectName = mark.subject.subjectName;

        if (!examMap.has(examName)) {
            examMap.set(examName, {
                examId,
                examName,
                grade: mark.grade.gradeName,
                academicYear: mark.academicYear.academicYear,
                term: mark.term,
                subjects: [],
                totalSubjects: 0,
                averagePercentage: 0
            });
        }

        const exam = examMap.get(examName);
        exam.subjects.push({
            subjectId,
            subjectName,
            totalMark: mark.mark,
            studentMark: mark.studentMark || 0,
            percentage: mark.studentMark ? ((mark.studentMark / mark.mark) * 100).toFixed(2) : 0,
            status: mark.status,
            categoryMarks: mark.categoryMark || []
        });
    });

    // Calculate totals and averages for each exam
    examMap.forEach(exam => {
        exam.totalSubjects = exam.subjects.length;
        exam.averagePercentage = exam.subjects.length > 0 
            ? (exam.subjects.reduce((sum, subject) => sum + parseFloat(subject.percentage), 0) / exam.subjects.length).toFixed(2)
            : 0;
        exams.push(exam);
    });

    // Calculate overall statistics
    const allSubjects = exams.flatMap(exam => exam.subjects);
    const totalSubjects = allSubjects.length;
    const overallAveragePercentage = allSubjects.length > 0 
        ? (allSubjects.reduce((sum, subject) => sum + parseFloat(subject.percentage), 0) / allSubjects.length).toFixed(2)
        : 0;

    res.status(200).json({
        status: 'success',
        data: {
            exams,
            totalExams: exams.length,
            totalSubjects,
            averagePercentage: overallAveragePercentage
        }
    });
});

// Get student subject-wise exam status
exports.getStudentSubjectExamStatus = catchAsync(async (req, res, next) => {
    const studentId = req.studentId;
    if (!studentId) {
        return next(new AppError('Student ID not found in token', 401));
    }

    const { subjectId } = req.params;
    
    // Get current settings (academic year and term)
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }

    const academicYearId = currentSettings.academicYear._id;
    const term = currentSettings.term;

    // Get gradeId from current academic info
    const currentAcademic = await AcademicStudent.findOne({ 
        studentId: studentId,
        status: 'active'
    }).populate('academicYear grade');
    
    if (!currentAcademic) {
        return next(new AppError('Student academic information not found', 404));
    }

    const gradeId = currentAcademic.grade._id;

    const studentMarks = await StudentMarks.find({
        studentId,
        subject: subjectId,
        academicYear: academicYearId,
        grade: gradeId,
        term
    }).populate([
        {
            path: 'subject',
            select: 'subjectName'
        },
        {
            path: 'grade',
            select: 'gradeName'
        },
        {
            path: 'academicYear',
            select: 'academicYear'
        },
        {
            path: 'examName',
            select: 'examName publishDate'
        },
        {
            path: 'categoryMark.categoryId',
            populate: {
                path: 'subCategory',
                select: 'name mark'
            }
        }
    ]);

    // Filter marks based on publish date - only show if publish date is less than or equal to current date
    const currentDate = new Date();
    const filteredMarks = studentMarks.filter(mark => {
        if (!mark.examName || !mark.examName.publishDate) {
            return false; // Hide marks if exam or publish date is missing
        }
        const publishDate = new Date(mark.examName.publishDate);
        return publishDate <= currentDate;
    });

    if (!filteredMarks.length) {
        return res.status(404).json({
            status: 'error',
            message: 'No marks found for this subject'
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            subjectDetails: {
                subjectName: filteredMarks[0].subject.subjectName,
                grade: filteredMarks[0].grade.gradeName,
                academicYear: filteredMarks[0].academicYear.academicYear,
                term: filteredMarks[0].term
            },
            exams: filteredMarks.map(mark => ({
                examId: mark.examName?._id || null,
                examName: mark.examName?.examName || 'Unknown Exam',
                totalMark: mark.mark,
                studentMark: mark.studentMark || 0,
                percentage: mark.studentMark ? ((mark.studentMark / mark.mark) * 100).toFixed(2) : 0,
                status: mark.status,
                categoryMarks: mark.categoryMark || []
            }))
        }
    });
});

// Get single exam details
exports.getSingleExamDetails = catchAsync(async (req, res, next) => {
    const studentId = req.studentId;
    if (!studentId) {
        return next(new AppError('Student ID not found in token', 401));
    }

    const { examName } = req.params;
    const { subjectId } = req.query;
    
    // Get current settings (academic year and term)
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }

    const academicYearId = currentSettings.academicYear._id;
    const term = currentSettings.term;

    // Get gradeId from current academic info
    const currentAcademic = await AcademicStudent.findOne({ 
        studentId: studentId,
        status: 'active'
    }).populate('academicYear grade');
    
    if (!currentAcademic) {
        return next(new AppError('Student academic information not found', 404));
    }

    const gradeId = currentAcademic.grade._id;

    const studentMark = await StudentMarks.findOne({
        studentId,
        examName,
        academicYear: academicYearId,
        grade: gradeId,
        term,
        subject: subjectId
    }).populate([
        {
            path: 'subject',
            select: 'subjectName'
        },
        {
            path: 'grade',
            select: 'gradeName'
        },
        {
            path: 'academicYear',
            select: 'academicYear'
        },
        {
            path: 'examName',
            select: 'examName publishDate'
        },
        {
            path: 'categoryMark.categoryId',
            populate: {
                path: 'subCategory',
                select: 'name mark'
            }
        }
    ]);

    if (!studentMark) {
        return res.status(404).json({
            status: 'error',
            message: 'Exam details not found'
        });
    }

    // Check if exam publish date allows viewing
    const currentDate = new Date();
    if (!studentMark.examName || !studentMark.examName.publishDate) {
        return res.status(404).json({
            status: 'error',
            message: 'Exam details not available'
        });
    }
    
    const publishDate = new Date(studentMark.examName.publishDate);
    if (publishDate > currentDate) {
        return res.status(404).json({
            status: 'error',
            message: 'Exam details not yet published'
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            examDetails: {
                examId: studentMark.examName?._id || null,
                examName: studentMark.examName?.examName || 'Unknown Exam',
                subjectName: studentMark.subject.subjectName,
                grade: studentMark.grade.gradeName,
                academicYear: studentMark.academicYear.academicYear,
                term: studentMark.term,
                totalMark: studentMark.mark,
                studentMark: studentMark.studentMark || 0,
                percentage: studentMark.studentMark ? ((studentMark.studentMark / studentMark.mark) * 100).toFixed(2) : 0,
                status: studentMark.status,
                categoryMarks: studentMark.categoryMark || []
            }
        }
    });
});

// Get all exams for student
exports.getStudentAllExams = catchAsync(async (req, res, next) => {
    const studentId = req.studentId;
    if (!studentId) {
        return next(new AppError('Student ID not found in token', 401));
    }

    // Get current settings (academic year and term)
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }

    const academicYearId = currentSettings.academicYear._id;
    const term = currentSettings.term;

    const exams = await Exam.find({
        academicYear: academicYearId,
        term,
        status: 'active'
    }).populate([
        {
            path: 'academicYear',
            select: 'academicYear'
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            exams: exams.map(exam => ({
                examId: exam._id,
                examName: exam.examName,
                academicYear: exam.academicYear.academicYear,
                term: exam.term,
                status: exam.status
            }))
        }
    });
});

// Get exam-wise subjects for student
exports.getStudentExamSubjects = catchAsync(async (req, res, next) => {
    const studentId = req.studentId;
    if (!studentId) {
        return next(new AppError('Student ID not found in token', 401));
    }

    const { examName } = req.query;
    
    if (!examName) {
        return next(new AppError('Exam name is required', 400));
    }

    // Get current settings (academic year and term)
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }

    const academicYearId = currentSettings.academicYear._id;
    const term = currentSettings.term;

    // Get gradeId from current academic info
    const currentAcademic = await AcademicStudent.findOne({ 
        studentId: studentId,
        status: 'active'
    }).populate('academicYear grade');
    
    if (!currentAcademic) {
        return next(new AppError('Student academic information not found', 404));
    }

    const gradeId = currentAcademic.grade._id;

    // First, find the exam by name
    const exam = await Exam.findById(examName);

    if (!exam) {
        return res.status(404).json({
            status: 'error',
            message: 'Exam not found'
        });
    }

    // console.log({studentId, exam: exam?._id, academicYearId, gradeId, term})

    // Check if exam publish date allows viewing
    const currentDate = new Date();
    if (!exam.publishDate) {
        return res.status(404).json({
            status: 'error',
            message: 'Exam details not available'
        });
    }
    
    const publishDate = new Date(exam.publishDate);
    if (publishDate > currentDate) {
        return res.status(404).json({
            status: 'error',
            message: 'Exam details not yet published'
        });
    }

    // Get all subjects for this exam
    const studentMarks = await StudentMarks.find({
        studentId,
        examName: exam._id,
        academicYear: academicYearId,
        grade: gradeId,
        term
    }).populate([
        {
            path: 'subject',
            select: 'subjectName'
        },
        {
            path: 'grade',
            select: 'gradeName'
        },
        {
            path: 'academicYear',
            select: 'academicYear'
        },
        {
            path: 'examName',
            select: 'examName publishDate'
        }
    ]);

    if (!studentMarks.length) {
        return res.status(404).json({
            status: 'error',
            message: 'No marks found for this exam'
        });
    }

    // Calculate exam details
    const examDetails = {
        examId: exam._id,
        examName: exam.examName,
        grade: studentMarks[0].grade.gradeName,
        academicYear: studentMarks[0].academicYear.academicYear,
        term: studentMarks[0].term,
        totalSubjects: studentMarks.length,
        averagePercentage: studentMarks.length > 0 
            ? (studentMarks.reduce((sum, mark) => {
                const percentage = mark.studentMark ? ((mark.studentMark / mark.mark) * 100) : 0;
                return sum + percentage;
            }, 0) / studentMarks.length).toFixed(2)
            : 0
    };

    // Map subjects
    const subjects = studentMarks.map(mark => ({
        subjectId: mark.subject._id,
        subjectName: mark.subject.subjectName,
        totalMark: mark.mark,
        studentMark: mark.studentMark || 0,
        percentage: mark.studentMark ? ((mark.studentMark / mark.mark) * 100).toFixed(2) : 0,
        status: mark.status,
        categoryMarks: mark.categoryMark || []
    }));

    res.status(200).json({
        status: 'success',
        data: {
            examDetails,
            subjects
        }
    });
});
