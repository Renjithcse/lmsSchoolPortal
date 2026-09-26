const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const Student = require('../../models/users/Student');
const AcademicStudent = require('../../models/users/AcademicStudent');
const {StudentMarks} = require('../../models/MarkEntry/Mark');
const StudentExamAttempt = require('../../models/OnlineExam/StudentExamAttempt');
const StudentPerformance = require('../../models/OnlineExam/StudentPerformance');
const StudentAssignmentAttempt = require('../../models/Assignments/StudentAssignment');
const PublishAssignment = require('../../models/Assignments/Publish');
const Publish = require('../../models/OnlineExam/Publish');
const Settings = require('../../models/Admin/Settings');
const Timetable = require('../../models/Admin/Timetable');
const mongoose = require('mongoose');

// Get comprehensive student dashboard data
exports.getStudentDashboard = catchAsync(async (req, res, next) => {
    // Get studentId from token (populated by auth middleware)
    let studentId = req.studentId;
    console.log('Dashboard - studentId:', studentId);
    console.log('Dashboard - req.studentId type:', typeof studentId);
    
    // If studentId is not set by middleware, try to get it from the user
    if (!studentId && req.user && req.user.role === 'student') {
        const student = await Student.findOne({ userId: req.user._id });
        if (student) {
            studentId = student._id;
            console.log('Dashboard - Found studentId from user:', studentId);
        }
    }
    
    if (!studentId) {
        return next(new AppError('Student ID not found in token', 401));
    }

    // Validate studentId is a valid ObjectId
    if (!require('mongoose').Types.ObjectId.isValid(studentId)) {
        return next(new AppError('Invalid student ID format', 400));
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
    }).populate('academicYear grade section');
    
    console.log('Dashboard - currentAcademic:', currentAcademic);

    if (!currentAcademic) {
        return next(new AppError('Student academic information not found', 404));
    }

    // Check if required populated fields exist
    if (!currentAcademic.grade) {
        console.log('Dashboard - Missing academic data:', {
            grade: currentAcademic.grade
        });
        return next(new AppError('Academic information is incomplete', 400));
    }

    const gradeId = currentAcademic.grade._id;

    // Get student details
    const student = await Student.findById(studentId)
        .populate('grade', 'gradeName')
        .populate('section', 'sectionName')
        .populate('academicYear', 'academicYear');

    if (!student) {
        return next(new AppError('Student not found', 404));
    }

    console.log({student})

    // Check if required populated fields exist
    if (!student.grade || !student.section) {
        return next(new AppError('Student academic information is incomplete', 400));
    }

    // Calculate GPA and performance statistics
    const studentMarks = await StudentMarks.find({
        studentId: studentId,
        academicYear: academicYearId,
        grade: gradeId,
        term
    }).populate('subject', 'subjectName');

    // Calculate GPA
    let totalMarks = 0;
    let totalMaxMarks = 0;
    const subjectPerformance = [];

    studentMarks.forEach(mark => {
        if (mark.studentMark && mark.mark && mark.subject) {
            totalMarks += mark.studentMark;
            totalMaxMarks += mark.mark;
            
            const percentage = (mark.studentMark / mark.mark) * 100;
            subjectPerformance.push({
                subject: mark.subject?.subjectName || 'Unknown Subject',
                percentage: Math.round(percentage),
                obtained: mark.studentMark,
                total: mark.mark
            });
        }
    });

    const gpa = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 4 : 0;

    // Get attendance data (mock data for now - can be enhanced with real attendance model)
    const attendanceData = [
        { month: 'Jan', present: 95, absent: 5 },
        { month: 'Feb', present: 92, absent: 8 },
        { month: 'Mar', present: 98, absent: 2 },
        { month: 'Apr', present: 89, absent: 11 },
        { month: 'May', present: 96, absent: 4 },
        { month: 'Jun', present: 94, absent: 6 }
    ];

    const averageAttendance = attendanceData.reduce((sum, month) => sum + month.present, 0) / attendanceData.length;

    // Get assignment statistics
    const assignmentAttempts = await StudentAssignmentAttempt.find({ studentId })
        .populate({
            path: 'publishId',
            populate: {
                path: 'assignment',
                select: 'subjectId',
                populate: {
                    path: 'subjectId',
                    select: 'subjectName'
                }
            }
        });

    const currentDate = new Date();
    let totalAssignments = 0;
    let completedAssignments = 0;
    let pendingAssignments = 0;
    let expiredAssignments = 0;

    assignmentAttempts.forEach(attempt => {
        if (attempt.publishId && attempt.publishId.assignment) {
            totalAssignments++;
            if (attempt.attendedStatus) {
                completedAssignments++;
            } else if (attempt.publishId.endDate < currentDate) {
                expiredAssignments++;
            } else {
                pendingAssignments++;
            }
        }
    });

    // Get online exam statistics
    const examAttempts = await StudentExamAttempt.find({ studentId })
        .populate({
            path: 'publishId',
            populate: {
                path: 'exam',
                select: 'subjectId',
                populate: {
                    path: 'subjectId',
                    select: 'subjectName'
                }
            }
        });

    let totalExams = 0;
    let completedExams = 0;
    let pendingExams = 0;
    let expiredExams = 0;

    examAttempts.forEach(attempt => {
        if (attempt.publishId && attempt.publishId.exam) {
            totalExams++;
            if (attempt.attendedStatus) {
                completedExams++;
            } else if (attempt.publishId.endDate < currentDate) {
                expiredExams++;
            } else {
                pendingExams++;
            }
        }
    });

    // Get recent assignments
    const recentAssignments = await StudentAssignmentAttempt.find({ studentId })
        .populate({
            path: 'publishId',
            populate: {
                path: 'assignment',
                select: 'assignmentName subjectId',
                populate: {
                    path: 'subjectId',
                    select: 'subjectName'
                }
            }
        })
        .sort({ createdAt: -1 })
        .limit(5);

    // Get upcoming events (assignments and exams due soon)
    const upcomingAssignments = await PublishAssignment.find({
        endDate: { $gte: currentDate },
        grade: gradeId
    })
    .populate({
        path: 'assignment',
        select: 'assignmentName subjectId',
        populate: {
            path: 'subjectId',
            select: 'subjectName'
        }
    })
    .sort({ endDate: 1 })
    .limit(5);

    const upcomingExams = await Publish.find({
        endDate: { $gte: currentDate },
        grade: gradeId
    })
    .populate({
        path: 'exam',
        select: 'examName subjectId',
        populate: {
            path: 'subjectId',
            select: 'subjectName'
        }
    })
    .sort({ endDate: 1 })
    .limit(5);

    // Combine and sort upcoming events
    const upcomingEvents = [
        ...upcomingAssignments.map(assignment => ({
            title: assignment?.assignment?.assignmentName || 'Unknown Assignment',
            date: assignment?.endDate || new Date(),
            type: 'assignment',
            subject: assignment?.assignment?.subjectId?.subjectName || 'Unknown Subject',
            priority: assignment?.endDate && (assignment.endDate - currentDate < 7 * 24 * 60 * 60 * 1000) ? 'high' : 'medium'
        })),
        ...upcomingExams.map(exam => ({
            title: exam?.exam?.examName || 'Unknown Exam',
            date: exam?.endDate || new Date(),
            type: 'exam',
            subject: exam?.exam?.subjectId?.subjectName || 'Unknown Subject',
            priority: exam?.endDate && (exam.endDate - currentDate < 7 * 24 * 60 * 60 * 1000) ? 'high' : 'medium'
        }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);

    // Prepare chart data
    const performanceChartData = subjectPerformance.map(subject => ({
        subject: subject.subject,
        percentage: subject.percentage,
        obtained: subject.obtained,
        total: subject.total
    }));

    const attendanceChartData = attendanceData;

    // Calculate overall statistics
    const overallStats = {
        gpa: Math.round(gpa * 100) / 100,
        attendance: Math.round(averageAttendance),
        totalAssignments,
        completedAssignments,
        pendingAssignments,
        expiredAssignments,
        totalExams,
        completedExams,
        pendingExams,
        expiredExams,
        upcomingEvents: upcomingEvents.length
    };

    res.status(200).json({
        status: 'success',
        data: {
            student: {
                name: student?.studentName || 'Unknown',
                grade: currentAcademic?.grade?.gradeName || 'Unknown',
                section: currentAcademic?.section?.sectionName || 'Unknown',
                academicYear: currentSettings?.academicYear?.academicYear || 'Unknown',
                term: currentSettings?.term || 'Unknown',
                admissionDate: student?.Admission_date || null
            },
            overallStats,
            performanceChartData,
            attendanceChartData,
            subjectPerformance,
            recentAssignments: recentAssignments.map(attempt => ({
                title: attempt.publishId?.assignment?.assignmentName || 'Unknown Assignment',
                subject: attempt.publishId?.assignment?.subjectId?.subjectName || 'Unknown Subject',
                status: attempt.attendedStatus ? 'completed' : 'pending',
                dueDate: attempt.publishId?.endDate || null,
                grade: attempt.teacherRemarks || null
            })),
            upcomingEvents
        }
    });
});

// Get student performance analytics
exports.getStudentPerformanceAnalytics = catchAsync(async (req, res, next) => {
    let studentId = req.studentId;
    console.log('Analytics - studentId:', studentId);
    console.log('Analytics - req.studentId type:', typeof studentId);
    
    // If studentId is not set by middleware, try to get it from the user
    if (!studentId && req.user && req.user.role === 'student') {
        const student = await Student.findOne({ userId: req.user._id });
        if (student) {
            studentId = student._id;
            console.log('Analytics - Found studentId from user:', studentId);
        }
    }
    
    if (!studentId) {
        return next(new AppError('Student ID not found in token', 401));
    }

    // Validate studentId is a valid ObjectId
    if (!require('mongoose').Types.ObjectId.isValid(studentId)) {
        return next(new AppError('Invalid student ID format', 400));
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

    console.log('Analytics - currentAcademic:', currentAcademic);

    if (!currentAcademic) {
        return next(new AppError('Student academic information not found', 404));
    }

    // Check if required populated fields exist
    if (!currentAcademic.grade) {
        console.log('Analytics - Missing academic data:', {
            grade: currentAcademic.grade
        });
        return next(new AppError('Academic information is incomplete', 400));
    }

    const gradeId = currentAcademic.grade._id;

    // Get performance data by term
    const performanceByTerm = await StudentMarks.aggregate([
        {
            $match: {
                studentId: studentId,
                academicYear: academicYearId,
                grade: gradeId,
                term
            }
        },
        {
            $group: {
                _id: '$term',
                averagePercentage: {
                    $avg: {
                        $multiply: [
                            { $divide: ['$studentMark', '$mark'] },
                            100
                        ]
                    }
                },
                totalExams: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    // Get subject-wise performance
    const subjectPerformance = await StudentMarks.aggregate([
        {
            $match: {
                studentId: studentId,
                academicYear: academicYearId,
                grade: gradeId,
                term
            }
        },
        {
            $lookup: {
                from: 'subjects',
                localField: 'subject',
                foreignField: '_id',
                as: 'subjectInfo'
            }
        },
        {
            $unwind: '$subjectInfo'
        },
        {
            $group: {
                _id: '$subject',
                subjectName: { $first: '$subjectInfo.subjectName' },
                averagePercentage: {
                    $avg: {
                        $multiply: [
                            { $divide: ['$studentMark', '$mark'] },
                            100
                        ]
                    }
                },
                totalExams: { $sum: 1 },
                bestScore: { $max: { $divide: ['$studentMark', '$mark'] } },
                worstScore: { $min: { $divide: ['$studentMark', '$mark'] } }
            }
        },
        {
            $sort: { averagePercentage: -1 }
        }
    ]);

    // Get assignment completion trends
    const assignmentTrends = await StudentAssignmentAttempt.aggregate([
        {
            $match: { studentId: studentId }
        },
        {
            $lookup: {
                from: 'publishassignments',
                localField: 'publishId',
                foreignField: '_id',
                as: 'publishInfo'
            }
        },
        {
            $unwind: '$publishInfo'
        },
        {
            $group: {
                _id: {
                    year: { $year: '$publishInfo.endDate' },
                    month: { $month: '$publishInfo.endDate' }
                },
                totalAssignments: { $sum: 1 },
                completedAssignments: {
                    $sum: { $cond: ['$attendedStatus', 1, 0] }
                }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1 }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            performanceByTerm,
            subjectPerformance,
            assignmentTrends
        }
    });
});

// Get student's timetable
exports.getStudentTimetable = catchAsync(async (req, res, next) => {
    let studentId = req.studentId;
    console.log('Timetable - studentId:', studentId);
    
    // If studentId is not set by middleware, try to get it from the user
    if (!studentId && req.user && req.user.role === 'student') {
        const student = await Student.findOne({ userId: req.user._id });
        if (student) {
            studentId = student._id;
            console.log('Timetable - Found studentId from user:', studentId);
        }
    }
    
    if (!studentId) {
        return next(new AppError('Student ID not found in token', 401));
    }

    // Validate studentId is a valid ObjectId
    if (!require('mongoose').Types.ObjectId.isValid(studentId)) {
        return next(new AppError('Invalid student ID format', 400));
    }

    // Get current settings (academic year and term)
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }

    const academicYearId = currentSettings.academicYear._id;
    const term = currentSettings.term;

    // Get student's current academic information
    const currentAcademic = await AcademicStudent.findOne({ 
        studentId: studentId,
        status: 'active'
    }).populate('academicYear grade section');
    
    if (!currentAcademic) {
        return next(new AppError('Student academic information not found', 404));
    }

    // Check if required populated fields exist
    if (!currentAcademic.grade || !currentAcademic.section) {
        return next(new AppError('Student academic information is incomplete', 400));
    }

    const gradeId = currentAcademic.grade._id;
    const sectionId = currentAcademic.section._id;
    const gender = currentAcademic.gender || 'male'; // Default to male if not specified

    // Find the timetable for this student's class
    let timetable = await Timetable.findOne({
        academicYear: academicYearId,
        term: term,
        grade: gradeId,
        gender: gender,
        section: sectionId,
        status: 'published' // Only get published timetables
    })
    .populate('academicYear', 'academicYear')
    .populate('grade', 'gradeName')
    .populate('section', 'sectionName');

    if (timetable) {
        // Populate gradeSubject data for each day
        const GradeSubject = require('../../models/Admin/GradeSubject');
        const Subject = require('../../models/Admin/Subject');
        const Teacher = require('../../models/users/Teacher');
        
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        for (const day of days) {
            if (timetable.weeklyTimetable[day]) {
                for (let i = 0; i < timetable.weeklyTimetable[day].length; i++) {
                    const period = timetable.weeklyTimetable[day][i];
                    
                    // Only populate for non-break periods
                    if (!period.isBreak) {
                        // If gradeSubject ID is available, populate from it
                        if (period.gradeSubject && mongoose.Types.ObjectId.isValid(period.gradeSubject)) {
                            const gradeSubject = await GradeSubject.findById(period.gradeSubject)
                                .populate('subject', 'subjectName')
                                .populate('teacher', 'employeeName employeeId');
                            
                            if (gradeSubject) {
                                timetable.weeklyTimetable[day][i].subject = gradeSubject.subject;
                                // Teacher might be null, that's okay
                                timetable.weeklyTimetable[day][i].teacher = gradeSubject.teacher;
                            }
                        } else {
                            // Legacy support: populate individual subject/teacher fields
                            if (period.subject && mongoose.Types.ObjectId.isValid(period.subject)) {
                                const subject = await Subject.findById(period.subject).select('subjectName');
                                if (subject) {
                                    timetable.weeklyTimetable[day][i].subject = subject;
                                }
                            }
                            
                            if (period.teacher && mongoose.Types.ObjectId.isValid(period.teacher)) {
                                const teacher = await Teacher.findById(period.teacher).select('employeeName employeeId');
                                if (teacher) {
                                    timetable.weeklyTimetable[day][i].teacher = teacher;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (!timetable) {
        return res.status(200).json({
            status: 'success',
            message: 'No timetable found for your class',
            data: {
                student: {
                    name: currentAcademic.studentId?.studentName || 'Unknown',
                    grade: currentAcademic.grade?.gradeName || 'Unknown',
                    section: currentAcademic.section?.sectionName || 'Unknown',
                    academicYear: currentSettings.academicYear?.academicYear || 'Unknown',
                    term: currentSettings.term || 'Unknown'
                },
                timetable: null
            }
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            student: {
                name: currentAcademic.studentId?.studentName || 'Unknown',
                grade: currentAcademic.grade?.gradeName || 'Unknown',
                section: currentAcademic.section?.sectionName || 'Unknown',
                academicYear: currentSettings.academicYear?.academicYear || 'Unknown',
                term: currentSettings.term || 'Unknown'
            },
            timetable: {
                id: timetable._id,
                name: timetable.name,
                weeklyTimetable: timetable.weeklyTimetable,
                createdAt: timetable.createdAt,
                updatedAt: timetable.updatedAt
            }
        }
    });
});
