const Teacher = require('../../models/users/Teacher');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const SubjectPermissions = require('../../models/Admin/SubjectPermissions');
const GradePermissions = require('../../models/Admin/GradePermissions');
const GradeSubject = require('../../models/Admin/GradeSubject');
const StudentAssignment = require('../../models/Assignments/StudentAssignment');
const StudentExamAttempt = require('../../models/OnlineExam/StudentExamAttempt');
const AcademicStudent = require('../../models/users/AcademicStudent');
const PublishAssignment = require('../../models/Assignments/Publish');
const Assignment = require('../../models/Assignments/Assignment');
const StudentAssignmentAttempt = require('../../models/Assignments/StudentAssignment');
const Section = require('../../models/Admin/Section');
const Publish = require('../../models/OnlineExam/Publish');
const OnlineExam = require('../../models/OnlineExam/OnlineExam');
const QuestionBank = require('../../models/OnlineExam/QuestionBank');
const Question = require('../../models/OnlineExam/Question');
const StudentPerformance = require('../../models/OnlineExam/StudentPerformance');
const Settings = require('../../models/Admin/Settings');
const SubjectNotes = require('../../models/SubjectNotes/SubjectNotes');
const Information = require('../../models/Information/Information');
const APIFeatures = require('../../utils/apiFeatures');
const { generatePresignedUrl } = require('../../middlewares/s3UploadMiddleware');

const mongoose = require('mongoose');

const formatMonthLabel = (yearMonth) => {
    if (!yearMonth || typeof yearMonth !== 'string' || !yearMonth.includes('-')) {
        return 'Unknown';
    }
    const [year, month] = yearMonth.split('-').map(Number);
    if (!Number.isFinite(year) || !Number.isFinite(month)) {
        return 'Unknown';
    }
    const date = new Date(Date.UTC(year, month - 1, 1));
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

// Create a new Teacher
exports.createTeacher = catchAsync(async (req, res, next) => {
    const { uploadTeacherProfilePictureToS3 } = require('../../utils/teacherS3Helper');
    
    // Handle profile picture upload if provided as base64
    if (req.body.profilePicture && typeof req.body.profilePicture === 'string' && req.body.profilePicture.startsWith('data:image/')) {
        try {
            const profilePictureData = await uploadTeacherProfilePictureToS3(req.body.profilePicture, 'teachers/profiles');
            req.body.profilePicture = profilePictureData.url;
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            return next(new AppError('Failed to upload profile picture: ' + error.message, 400));
        }
    }
    
    const teacher = await Teacher.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            teacher,
        },
    });
});

// Get all Teachers
exports.getTeachers = catchAsync(async (req, res, next) => {
    const teachers = await Teacher.find()
        .populate('Religion', 'religionName')
        .populate('nationality', 'nationality');

    res.status(200).json({
        status: 'success',
        results: teachers.length,
        data: teachers
    });
});

// Get a single Teacher by ID
exports.getTeacherById = catchAsync(async (req, res, next) => {
    const teacher = await Teacher.findById(req.params.id)
        .populate('Religion', 'religionName')
        .populate('nationality', 'nationality');

    if (!teacher) {
        return next(new AppError('No teacher found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: teacher
    });
});

// Update a Teacher by ID
exports.updateTeacher = catchAsync(async (req, res, next) => {
    const { uploadTeacherProfilePictureToS3, deleteTeacherProfilePictureFromS3 } = require('../../utils/teacherS3Helper');
    
    // Handle profile picture upload if provided as base64
    if (req.body.profilePicture && typeof req.body.profilePicture === 'string' && req.body.profilePicture.startsWith('data:image/')) {
        try {
            // Get existing teacher to check for old profile picture
            const existingTeacher = await Teacher.findById(req.params.id);
            
            // Delete old profile picture from S3 if it exists
            if (existingTeacher && existingTeacher.profilePicture) {
                try {
                    await deleteTeacherProfilePictureFromS3(existingTeacher.profilePicture);
                } catch (error) {
                    console.error('Error deleting old profile picture:', error);
                    // Continue with upload even if deletion fails
                }
            }
            
            // Upload new profile picture to S3
            const profilePictureData = await uploadTeacherProfilePictureToS3(req.body.profilePicture, 'teachers/profiles');
            req.body.profilePicture = profilePictureData.url;
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            return next(new AppError('Failed to upload profile picture: ' + error.message, 400));
        }
    }
    
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    })
        .populate('Religion', 'religionName')
        .populate('nationality', 'nationality');

    if (!teacher) {
        return next(new AppError('No teacher found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            teacher,
        },
    });
});

// Delete a Teacher by ID only if not used in any other models
exports.deleteTeacher = catchAsync(async (req, res, next) => {
    const teacherId = req.params.id;

    // First, check if the teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
        return next(new AppError('No teacher found with that ID', 404));
    }

    // Check if the teacher is being used in SubjectPermissions model
    const subjectPermissions = await SubjectPermissions.find({ teacher: teacherId });
    if (subjectPermissions.length > 0) {
        return next(new AppError(
            `Cannot delete teacher. This teacher is being used by ${subjectPermissions.length} subject permission record(s). Please delete the subject permissions first.`, 
            400
        ));
    }

    // Check if the teacher is being used in GradePermissions model
    const gradePermissions = await GradePermissions.find({ teacherId: teacherId });
    if (gradePermissions.length > 0) {
        return next(new AppError(
            `Cannot delete teacher. This teacher is being used by ${gradePermissions.length} grade permission record(s). Please delete the grade permissions first.`, 
            400
        ));
    }

    // Check if the teacher is being used in GradeSubject model
    const gradeSubjects = await GradeSubject.find({ teacher: teacherId });
    if (gradeSubjects.length > 0) {
        return next(new AppError(
            `Cannot delete teacher. This teacher is being used by ${gradeSubjects.length} grade subject record(s). Please delete the grade subjects first.`, 
            400
        ));
    }

    // Check if the teacher is being used in StudentAssignment model
    const studentAssignments = await StudentAssignment.find({ teacherId: teacherId });
    if (studentAssignments.length > 0) {
        return next(new AppError(
            `Cannot delete teacher. This teacher is being used by ${studentAssignments.length} student assignment record(s). Please delete the assignment records first.`, 
            400
        ));
    }

    // Check if the teacher is being used in StudentExamAttempt model
    const studentExamAttempts = await StudentExamAttempt.find({ teacherId: teacherId });
    if (studentExamAttempts.length > 0) {
        return next(new AppError(
            `Cannot delete teacher. This teacher is being used by ${studentExamAttempts.length} exam attempt record(s). Please delete the exam attempt records first.`, 
            400
        ));
    }

    // If no dependencies exist, proceed with deletion
    await Teacher.findByIdAndDelete(teacherId);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

// Get all teachers name and id only
exports.getTeachersNameAndId = catchAsync(async (req, res, next) => {
    const teachers = await Teacher.find({}, { employeeName: 1, employeeId: 1, _id: 1 })

    res.status(200).json({
        status: 'success',
        data: teachers
    });
});

exports.getTeacherDashboardStats = catchAsync(async (req, res, next) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
        totalTeachers,
        activeTeachers,
        inactiveTeachers,
        newThisMonth,
        avgExperienceAgg,
        genderAgg,
        designationAgg,
        qualificationAgg,
        experienceDocs,
        subjectPermissionAgg,
        gradePermissionAgg,
        recentHiresDocs,
        timelineAgg,
    ] = await Promise.all([
        Teacher.countDocuments(),
        Teacher.countDocuments({ status: 'active' }),
        Teacher.countDocuments({ status: 'inactive' }),
        Teacher.countDocuments({ createdAt: { $gte: startOfMonth } }),
        Teacher.aggregate([
            { $match: { experienceInYears: { $ne: null } } },
            { $group: { _id: null, avgExperience: { $avg: '$experienceInYears' } } },
        ]),
        Teacher.aggregate([
            {
                $group: {
                    _id: { $ifNull: ['$gender', 'unknown'] },
                    count: { $sum: 1 },
                },
            },
        ]),
        Teacher.aggregate([
            {
                $group: {
                    _id: { $ifNull: ['$designation', 'Unassigned'] },
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ]),
        Teacher.aggregate([
            {
                $group: {
                    _id: { $ifNull: ['$qualification', 'Unspecified'] },
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ]),
        Teacher.find({}, { experienceInYears: 1 }).lean(),
        SubjectPermissions.aggregate([
            { $match: { teacher: { $ne: null } } },
            {
                $project: {
                    teacher: 1,
                    subjectCount: { $size: { $ifNull: ['$subjects', []] } },
                },
            },
            {
                $group: {
                    _id: '$teacher',
                    totalSubjects: { $sum: '$subjectCount' },
                },
            },
        ]),
        GradePermissions.aggregate([
            {
                $group: {
                    _id: '$teacherId',
                    totalGrades: { $sum: 1 },
                    genders: { $addToSet: '$gender' },
                },
            },
        ]),
        Teacher.find({})
            .sort({ createdAt: -1 })
            .limit(6)
            .select('employeeName designation status createdAt dateOfJoining experienceInYears employeeId')
            .lean(),
        Teacher.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]),
    ]);

    const avgExperienceValue = avgExperienceAgg?.[0]?.avgExperience;
    const averageExperience =
        typeof avgExperienceValue === 'number' && Number.isFinite(avgExperienceValue)
            ? Number(avgExperienceValue.toFixed(1))
            : 0;

    const genderDistribution = genderAgg.reduce((acc, item) => {
        const key = (item._id || 'unknown').toLowerCase();
        acc[key] = item.count;
        return acc;
    }, { male: 0, female: 0, other: 0, unknown: 0 });

    const designationDistribution = designationAgg.map((item) => ({
        designation: item._id || 'Unassigned',
        count: item.count,
    }));

    const qualificationDistribution = qualificationAgg.map((item) => ({
        qualification: item._id || 'Unspecified',
        count: item.count,
    }));

    const experienceBuckets = {
        '0-2': 0,
        '3-5': 0,
        '6-10': 0,
        '10+': 0,
    };

    experienceDocs.forEach((doc) => {
        const value = Number(doc.experienceInYears) || 0;
        if (value <= 2) experienceBuckets['0-2'] += 1;
        else if (value <= 5) experienceBuckets['3-5'] += 1;
        else if (value <= 10) experienceBuckets['6-10'] += 1;
        else experienceBuckets['10+'] += 1;
    });

    const subjectAssignmentsSorted = [...subjectPermissionAgg].sort((a, b) => b.totalSubjects - a.totalSubjects);
    const totalSubjectAssignments = subjectAssignmentsSorted.reduce((sum, entry) => sum + entry.totalSubjects, 0);
    const teacherIdsForSubjects = subjectAssignmentsSorted.map((item) => item._id).filter(Boolean);
    const subjectTeachersMap = new Map();

    if (teacherIdsForSubjects.length) {
        const teachers = await Teacher.find({ _id: { $in: teacherIdsForSubjects } })
            .select('employeeName employeeId designation')
            .lean();
        teachers.forEach((teacher) => {
            subjectTeachersMap.set(String(teacher._id), teacher);
        });
    }

    const topSubjectAssignments = subjectAssignmentsSorted.slice(0, 5).map((entry) => {
        const teacher = subjectTeachersMap.get(String(entry._id));
        return {
            teacherId: entry._id,
            teacherName: teacher?.employeeName || 'Unknown Teacher',
            employeeId: teacher?.employeeId || 'N/A',
            designation: teacher?.designation || 'Unassigned',
            totalSubjects: entry.totalSubjects,
        };
    });

    const gradePermissionStats = {
        totalGradePermissions: gradePermissionAgg.reduce((sum, entry) => sum + entry.totalGrades, 0),
        teachersWithGradePermissions: gradePermissionAgg.filter((entry) => entry._id).length,
    };

    const permissionsSummary = {
        totalSubjectAssignments,
        teachersWithSubjectAssignments: subjectAssignmentsSorted.filter((entry) => entry._id).length,
        ...gradePermissionStats,
    };

    const timeline = timelineAgg
        .slice(Math.max(timelineAgg.length - 12, 0))
        .map((item) => ({
            month: formatMonthLabel(item._id),
            value: item.count,
            raw: item._id,
        }));

    const recentHires = recentHiresDocs.map((doc) => ({
        id: doc._id,
        name: doc.employeeName,
        designation: doc.designation || 'Unassigned',
        status: doc.status,
        joinedOn: doc.dateOfJoining || doc.createdAt,
        experienceInYears: doc.experienceInYears ?? null,
    }));

    res.status(200).json({
        status: 'success',
        data: {
            summary: {
                totalTeachers,
                activeTeachers,
                inactiveTeachers,
                newThisMonth,
                averageExperience,
            },
            genderDistribution,
            designationDistribution,
            qualificationDistribution,
            experienceBuckets,
            permissionsSummary,
            topSubjectAssignments,
            recentHires,
            hiringTimeline: timeline,
        },
    });
});

exports.getMyTeacherDashboardStats = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    let teacherUserId = req.user?._id;

    if (!teacherId) {
        const teacher = await Teacher.findOne({ userId: req.user?._id });
        if (!teacher) {
            return next(new AppError('Teacher profile not found!', 404));
        }
        teacherId = teacher._id;
    }

    if (!teacherUserId) {
        const teacher = await Teacher.findById(teacherId);
        teacherUserId = teacher?.userId;
    }

    if (!teacherId) {
        return next(new AppError('Unable to resolve teacher context!', 400));
    }

    const teacherDoc = await Teacher.findById(teacherId)
        .select('employeeName employeeId designation experienceInYears dateOfJoining status contactNo email')
        .lean();

    if (!teacherDoc) {
        return next(new AppError('Teacher profile not found!', 404));
    }

    const subjectPermissions = await SubjectPermissions.find({ teacher: teacherId })
        .populate('grade', 'gradeName')
        .populate('section', 'sectionName')
        .populate('subjects', 'subjectName')
        .lean();

    const classCoverageMap = new Map();

    subjectPermissions.forEach((permission) => {
        const gradeId = permission.grade?._id || permission.grade;
        const sectionId = permission.section?._id || permission.section;
        const key = `${gradeId?.toString() || 'unknown'}::${sectionId?.toString() || 'unknown'}`;

        if (!classCoverageMap.has(key)) {
            classCoverageMap.set(key, {
                gradeId,
                sectionId,
                gradeName: permission.grade?.gradeName || 'Unassigned',
                sectionName: permission.section?.sectionName || 'Unassigned',
                genders: new Set(),
            });
        }

        const entry = classCoverageMap.get(key);
        if (permission.gender) {
            entry.genders.add(permission.gender);
        }
    });

    const classCoverage = await Promise.all(
        Array.from(classCoverageMap.values()).map(async (entry) => {
            const filters = {
                grade: typeof entry.gradeId === 'string' && mongoose.Types.ObjectId.isValid(entry.gradeId)
                    ? new mongoose.Types.ObjectId(entry.gradeId)
                    : entry.gradeId,
                status: 'active',
            };

            if (entry.sectionId) {
                filters.section = typeof entry.sectionId === 'string' && mongoose.Types.ObjectId.isValid(entry.sectionId)
                    ? new mongoose.Types.ObjectId(entry.sectionId)
                    : entry.sectionId;
            }

            const gendersArray = Array.from(entry.genders);
            if (gendersArray.length === 1) {
                filters.gender = gendersArray[0];
            }

            const studentCount = await AcademicStudent.countDocuments(filters);

            return {
                gradeName: entry.gradeName,
                sectionName: entry.sectionName,
                genders: gendersArray,
                studentCount,
            };
        })
    );

    const studentsCovered = classCoverage.reduce((total, item) => total + (item.studentCount || 0), 0);
    const totalClasses = classCoverage.length;

    const subjectsSet = new Set();
    const subjectCoverageMap = new Map();

    subjectPermissions.forEach((permission) => {
        (permission.subjects || []).forEach((subject) => {
            const subjectName = subject?.subjectName || 'Unknown Subject';
            subjectsSet.add(subjectName);
            const gradeName = permission.grade?.gradeName || 'Unassigned';
            const sectionName = permission.section?.sectionName || 'Unassigned';
            const key = `${gradeName}::${sectionName}::${subjectName}`;
            if (!subjectCoverageMap.has(key)) {
                subjectCoverageMap.set(key, {
                    gradeName,
                    sectionName,
                    subjectName,
                });
            }
        });
    });

    const subjectCoverage = Array.from(subjectCoverageMap.values());

    const totalSubjects = subjectsSet.size;

    const assignmentAgg = await StudentAssignment.aggregate([
        {
            $match: {
                teacherId: mongoose.Types.ObjectId.isValid(teacherId)
                    ? new mongoose.Types.ObjectId(teacherId)
                    : teacherId,
            },
        },
        { $group: { _id: '$attendedStatus', count: { $sum: 1 } } },
    ]);

    const examAgg = await StudentExamAttempt.aggregate([
        {
            $match: {
                teacherId: mongoose.Types.ObjectId.isValid(teacherId)
                    ? new mongoose.Types.ObjectId(teacherId)
                    : teacherId,
            },
        },
        { $group: { _id: '$attendedStatus', count: { $sum: 1 } } },
    ]);

    const assignmentCompleted = assignmentAgg.find((item) => item._id === true)?.count || 0;
    const assignmentPending = assignmentAgg.find((item) => item._id === false)?.count || 0;
    const assignmentStats = {
        total: assignmentCompleted + assignmentPending,
        completed: assignmentCompleted,
        pending: assignmentPending,
    };

    const examCompleted = examAgg.find((item) => item._id === true)?.count || 0;
    const examPending = examAgg.find((item) => item._id === false)?.count || 0;
    const examStats = {
        total: examCompleted + examPending,
        completed: examCompleted,
        pending: examPending,
    };

    const performanceTrendAgg = await StudentExamAttempt.aggregate([
        {
            $match: {
                teacherId: mongoose.Types.ObjectId.isValid(teacherId)
                    ? new mongoose.Types.ObjectId(teacherId)
                    : teacherId,
            },
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                averageScore: { $avg: '$securedMark' },
                attempts: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    const performanceTrend = performanceTrendAgg.map((item) => ({
        month: formatMonthLabel(item._id),
        averageScore: Number(Number.parseFloat(item.averageScore || 0).toFixed(1)),
        attempts: item.attempts,
    }));

    const now = new Date();

    const assignmentPublishes = await PublishAssignment.find({ createdBy: teacherUserId })
        .populate({
            path: 'assignment',
            select: 'assignmentName subjectId',
            populate: { path: 'subjectId', select: 'subjectName' },
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

    const examPublishes = await Publish.find({ createdBy: teacherUserId })
        .populate({
            path: 'exam',
            select: 'examName subjectId',
            populate: { path: 'subjectId', select: 'subjectName' },
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

    const recentAssignments = assignmentPublishes.slice(0, 5).map((publish) => ({
        type: 'assignment',
        title: publish.assignment?.assignmentName || 'Assignment',
        subject: publish.assignment?.subjectId?.subjectName || 'Unknown Subject',
        startDate: publish.startDate,
        endDate: publish.endDate,
        status: publish.endDate && publish.endDate < now ? 'closed' : 'ongoing',
        createdAt: publish.createdAt,
    }));

    const upcomingAssignments = assignmentPublishes
        .filter((publish) => publish.startDate && publish.startDate >= now)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 5)
        .map((publish) => ({
            type: 'assignment',
            title: publish.assignment?.assignmentName || 'Assignment',
            subject: publish.assignment?.subjectId?.subjectName || 'Unknown Subject',
            startDate: publish.startDate,
            endDate: publish.endDate,
        }));

    const upcomingExams = examPublishes
        .filter((publish) => publish.startDate && publish.startDate >= now)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 5)
        .map((publish) => ({
            type: 'exam',
            title: publish.exam?.examName || 'Exam',
            subject: publish.exam?.subjectId?.subjectName || 'Unknown Subject',
            startDate: publish.startDate,
            endDate: publish.endDate,
        }));

    const upcomingSchedule = [...upcomingAssignments, ...upcomingExams]
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 6);

    const recentExamPublishes = examPublishes.slice(0, 5).map((publish) => ({
        type: 'exam',
        title: publish.exam?.examName || 'Exam',
        subject: publish.exam?.subjectId?.subjectName || 'Unknown Subject',
        startDate: publish.startDate,
        endDate: publish.endDate,
        createdAt: publish.createdAt,
        status: publish.endDate && publish.endDate < now ? 'closed' : 'scheduled',
    }));

    const recentActivity = [...recentAssignments, ...recentExamPublishes]
        .map((item) => ({
            type: item.type || 'activity',
            title: item.title,
            subject: item.subject,
            timestamp: item.createdAt || item.startDate,
            status: item.status,
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 8);

    const summary = {
        totalClasses,
        totalSubjects,
        studentsCovered,
        assignmentsCompleted: assignmentStats.completed,
        examsConducted: examStats.completed,
        upcomingEvents: upcomingSchedule.length,
    };

    res.status(200).json({
        status: 'success',
        data: {
            teacher: {
                id: teacherDoc._id,
                name: teacherDoc.employeeName,
                employeeId: teacherDoc.employeeId,
                designation: teacherDoc.designation,
                experienceInYears: teacherDoc.experienceInYears,
                dateOfJoining: teacherDoc.dateOfJoining,
                status: teacherDoc.status,
                email: teacherDoc.email,
                contactNo: teacherDoc.contactNo,
            },
            summary,
            classCoverage,
            subjectCoverage,
            assignmentStats,
            examStats,
            performanceTrend,
            recentAssignments,
            upcomingSchedule,
            recentActivity,
        },
    });
});

// Get teacher's timetable
exports.getMyTeacherTimetable = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    // If teacherId is not set by middleware, try to get it from the user
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    // Validate teacherId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        return next(new AppError('Invalid teacher ID format', 400));
    }

    // Get current settings (academic year and term)
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }

    const academicYearId = currentSettings.academicYear._id;
    const term = currentSettings.term;

    // Get all timetables where this teacher is assigned
    const Timetable = require('../../models/Admin/Timetable');
    const timetables = await Timetable.find({
        academicYear: academicYearId,
        term: term,
        status: 'published'
    })
    .populate('academicYear', 'academicYear')
    .populate('grade', 'gradeName')
    .populate('section', 'sectionName')
    .lean();

    // Filter timetables to only include those where teacher is assigned
    const Subject = require('../../models/Admin/Subject');
    
    const teacherTimetables = [];
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const timetable of timetables) {
        let hasTeacherPeriods = false;
        const teacherSchedule = {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: []
        };

        for (const day of days) {
            if (timetable.weeklyTimetable && timetable.weeklyTimetable[day]) {
                for (const period of timetable.weeklyTimetable[day]) {
                    if (!period.isBreak) {
                        let periodTeacherId = null;
                        
                        // Check if gradeSubject is available
                        if (period.gradeSubject && mongoose.Types.ObjectId.isValid(period.gradeSubject)) {
                            const gradeSubject = await GradeSubject.findById(period.gradeSubject)
                                .populate('subject', 'subjectName')
                                .populate('teacher', 'employeeName employeeId');
                            
                            if (gradeSubject && gradeSubject.teacher) {
                                periodTeacherId = gradeSubject.teacher._id?.toString() || gradeSubject.teacher.toString();
                                
                                // Populate period data
                                const populatedPeriod = {
                                    ...period,
                                    subject: gradeSubject.subject,
                                    teacher: gradeSubject.teacher,
                                    grade: timetable.grade,
                                    section: timetable.section,
                                    gradeName: timetable.grade?.gradeName,
                                    sectionName: timetable.section?.sectionName
                                };
                                
                                if (periodTeacherId === teacherId.toString()) {
                                    teacherSchedule[day].push(populatedPeriod);
                                    hasTeacherPeriods = true;
                                }
                            }
                        } else if (period.teacher && mongoose.Types.ObjectId.isValid(period.teacher)) {
                            // Legacy support: check direct teacher field
                            periodTeacherId = period.teacher.toString();
                            
                            if (periodTeacherId === teacherId.toString()) {
                                // Populate subject and teacher
                                let subject = null;
                                let teacher = null;
                                
                                if (period.subject && mongoose.Types.ObjectId.isValid(period.subject)) {
                                    subject = await Subject.findById(period.subject).select('subjectName').lean();
                                }
                                
                                teacher = await Teacher.findById(period.teacher).select('employeeName employeeId').lean();
                                
                                const populatedPeriod = {
                                    ...period,
                                    subject: subject,
                                    teacher: teacher,
                                    grade: timetable.grade,
                                    section: timetable.section,
                                    gradeName: timetable.grade?.gradeName,
                                    sectionName: timetable.section?.sectionName
                                };
                                
                                teacherSchedule[day].push(populatedPeriod);
                                hasTeacherPeriods = true;
                            }
                        }
                    }
                }
            }
        }

        if (hasTeacherPeriods) {
            teacherTimetables.push({
                id: timetable._id,
                name: timetable.name,
                grade: timetable.grade,
                section: timetable.section,
                gender: timetable.gender,
                academicYear: timetable.academicYear,
                term: timetable.term,
                weeklyTimetable: teacherSchedule
            });
        }
    }

    // Get teacher info
    const teacherDoc = await Teacher.findById(teacherId)
        .select('employeeName employeeId designation')
        .lean();

    res.status(200).json({
        status: 'success',
        data: {
            teacher: {
                name: teacherDoc?.employeeName || 'Unknown',
                employeeId: teacherDoc?.employeeId || 'Unknown',
                designation: teacherDoc?.designation || 'Unknown'
            },
            academicYear: currentSettings.academicYear?.academicYear || 'Unknown',
            term: currentSettings.term || 'Unknown',
            timetables: teacherTimetables
        }
    });
});

// Get teacher's subject notes (for classes they teach)
exports.getMyTeacherSubjectNotes = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    // If teacherId is not set by middleware, try to get it from the user
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    // Validate teacherId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        return next(new AppError('Invalid teacher ID format', 400));
    }

    // Get current settings (academic year and term)
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }

    const academicYearId = currentSettings.academicYear._id;

    // Get all GradeSubjects where this teacher is assigned
    const gradeSubjects = await GradeSubject.find({
        teacher: teacherId,
        academicYear: academicYearId,
        Status: 'active'
    })
    .populate('grade', 'gradeName')
    .populate('section', 'sectionName')
    .populate('subject', 'subjectName')
    .lean();

    if (gradeSubjects.length === 0) {
        return res.status(200).json({
            status: 'success',
            data: {
                teacher: {
                    name: 'Unknown',
                    employeeId: 'Unknown',
                },
                academicYear: currentSettings.academicYear?.academicYear || 'Unknown',
                totalNotes: 0,
                totalSubjects: 0,
                notesBySubject: []
            }
        });
    }

    // Get subject notes for all classes this teacher teaches
    const subjectNotes = await SubjectNotes.find({
        academicYear: academicYearId,
        status: 'published',
        $or: gradeSubjects.map(gs => ({
            grade: gs.grade._id,
            gender: gs.gender,
            section: gs.section._id,
            subject: gs.subject._id
        }))
    })
    .populate('academicYear', 'academicYear')
    .populate('grade', 'gradeName')
    .populate('section', 'sectionName')
    .populate('subject', 'subjectName')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

    // Generate pre-signed URLs for all documents
    const subjectNotesWithUrls = subjectNotes.map(note => {
        const noteObj = note.toObject();
        if (noteObj.documents && noteObj.documents.length > 0) {
            noteObj.documents = noteObj.documents.map(doc => {
                let s3Key = doc.s3Key;
                
                // If s3Key is not available, extract it from filePath
                if (!s3Key && doc.filePath && doc.filePath.includes('amazonaws.com/')) {
                    const urlParts = doc.filePath.split('amazonaws.com/');
                    if (urlParts.length > 1) {
                        s3Key = urlParts[1];
                    }
                }
                
                return {
                    ...doc,
                    downloadUrl: s3Key ? generatePresignedUrl(s3Key, 3600) : doc.filePath
                };
            });
        }
        return noteObj;
    });

    // Group notes by subject
    const notesBySubject = {};
    gradeSubjects.forEach(gs => {
        const subjectId = gs.subject._id.toString();
        const key = `${gs.grade.gradeName}-${gs.section.sectionName}-${gs.gender}-${subjectId}`;
        
        if (!notesBySubject[key]) {
            notesBySubject[key] = {
                grade: gs.grade,
                section: gs.section,
                gender: gs.gender,
                subject: gs.subject,
                notes: []
            };
        }
    });

    // Assign notes to their respective subjects
    subjectNotesWithUrls.forEach(note => {
        const key = `${note.grade.gradeName}-${note.section.sectionName}-${note.gender}-${note.subject._id.toString()}`;
        if (notesBySubject[key]) {
            notesBySubject[key].notes.push(note);
        }
    });

    // Get teacher info
    const teacherDoc = await Teacher.findById(teacherId)
        .select('employeeName employeeId designation')
        .lean();

    res.status(200).json({
        status: 'success',
        data: {
            teacher: {
                name: teacherDoc?.employeeName || 'Unknown',
                employeeId: teacherDoc?.employeeId || 'Unknown',
                designation: teacherDoc?.designation || 'Unknown'
            },
            academicYear: currentSettings.academicYear?.academicYear || 'Unknown',
            totalNotes: subjectNotesWithUrls.length,
            totalSubjects: Object.keys(notesBySubject).length,
            notesBySubject: Object.values(notesBySubject)
        }
    });
});

// Helper function to filter accessible information for teachers
const filterAccessibleInformationForTeacher = async (allInformation) => {
    const accessibleInformation = [];
    for (const info of allInformation) {
        // Teachers can view information published to:
        // - 'All Teachers'
        // - 'Both Teachers and Students'
        if (info.publishTo === 'All Teachers' || info.publishTo === 'Both Teachers and Students') {
            accessibleInformation.push(info);
        }
    }
    return accessibleInformation;
};

// Get all information visible to the teacher
exports.getMyTeacherInformation = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    // Get all published information that could be visible to teachers
    const allInformation = await Information.find({ 
        status: 'Published',
        publishTo: { $in: ['All Teachers', 'Both Teachers and Students'] },
        $or: [
            { expiryDate: null },
            { expiryDate: { $gt: new Date() } }
        ]
    }).populate('createdBy', 'name email').sort({ publishedAt: -1 });

    // Filter information based on teacher access rules
    const accessibleInformation = await filterAccessibleInformationForTeacher(allInformation);

    // Apply additional filtering and pagination
    let query = Information.find({
        _id: { $in: accessibleInformation.map(info => info._id) }
    }).populate('createdBy', 'name email');

    const features = new APIFeatures(query, req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const information = await features.query;
    const total = accessibleInformation.length;

    res.status(200).json({
        status: 'success',
        results: information.length,
        total,
        data: {
            information
        }
    });
});

// Get information by category for teachers
exports.getMyTeacherInformationByCategory = catchAsync(async (req, res, next) => {
    const { category } = req.params;
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    const validCategories = ['Information Desk', 'Help Desk', 'General Information'];
    if (!validCategories.includes(category)) {
        return next(new AppError('Invalid category', 400));
    }

    // Get all published information for the category that could be visible to teachers
    const allInformation = await Information.find({ 
        category,
        status: 'Published',
        publishTo: { $in: ['All Teachers', 'Both Teachers and Students'] },
        $or: [
            { expiryDate: null },
            { expiryDate: { $gt: new Date() } }
        ]
    }).populate('createdBy', 'name email').sort({ publishedAt: -1 });

    // Filter information based on teacher access rules
    const accessibleInformation = await filterAccessibleInformationForTeacher(allInformation);

    // Apply additional filtering and pagination
    let query = Information.find({
        _id: { $in: accessibleInformation.map(info => info._id) }
    }).populate('createdBy', 'name email');

    const features = new APIFeatures(query, req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const information = await features.query;

    res.status(200).json({
        status: 'success',
        results: information.length,
        total: accessibleInformation.length,
        data: {
            information
        }
    });
});

// Get information categories with counts for teachers
exports.getMyTeacherInformationCategories = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    const categories = ['Information Desk', 'Help Desk', 'General Information'];
    const categoriesWithCounts = [];

    for (const category of categories) {
        // Get all published information for the category that could be visible to teachers
        const allInformation = await Information.find({ 
            category,
            status: 'Published',
            publishTo: { $in: ['All Teachers', 'Both Teachers and Students'] },
            $or: [
                { expiryDate: null },
                { expiryDate: { $gt: new Date() } }
            ]
        });

        // Filter information based on teacher access rules
        const accessibleInformation = await filterAccessibleInformationForTeacher(allInformation);

        categoriesWithCounts.push({
            category,
            count: accessibleInformation.length
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            categories: categoriesWithCounts
        }
    });
});

// Get single information item for teacher
exports.getMyTeacherInformationById = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    const information = await Information.findById(id)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

    if (!information) {
        return next(new AppError('Information not found', 404));
    }

    // Check if teacher can view this information
    if (information.status !== 'Published') {
        return next(new AppError('Information not available', 404));
    }

    if (information.publishTo !== 'All Teachers' && information.publishTo !== 'Both Teachers and Students') {
        return next(new AppError('You do not have access to this information', 403));
    }

    // Check expiry date
    if (information.expiryDate && information.expiryDate < new Date()) {
        return next(new AppError('This information has expired', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            information
        }
    });
});

// Get teacher's own attendance
exports.getMyTeacherAttendance = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({
            status: 'error',
            message: 'Start date and end date are required'
        });
    }

    const Attendance = require('../../models/Attendance/Attendance');
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
        teacher: teacherId,
        attendanceType: 'teacher',
        date: { $gte: start, $lte: end },
        isActive: true
    })
    .populate('academicYear', 'academicYear')
    .sort({ date: -1 })
    .lean();

    // Calculate statistics
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const absentDays = attendance.filter(a => a.status === 'absent').length;
    const lateDays = attendance.filter(a => a.status === 'late').length;
    const halfDayDays = attendance.filter(a => a.status === 'half-day').length;
    const leaveDays = attendance.filter(a => a.status === 'leave').length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    res.status(200).json({
        status: 'success',
        data: {
            attendance,
            statistics: {
                totalDays,
                presentDays,
                absentDays,
                lateDays,
                halfDayDays,
                leaveDays,
                attendancePercentage,
                markedDays: attendance.length
            }
        }
    });
});

// Mark teacher's own attendance
exports.markMyTeacherAttendance = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    const { status, notes } = req.body;

    // Get current academic year
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }

    const academicYear = currentSettings.academicYear._id;

    const Attendance = require('../../models/Attendance/Attendance');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if attendance already exists for today
    const existingAttendance = await Attendance.findOne({
        date: { $gte: today, $lt: tomorrow },
        attendanceType: 'teacher',
        teacher: teacherId,
        isActive: true
    });

    if (existingAttendance) {
        // Update existing attendance
        existingAttendance.timeOut = new Date();
        existingAttendance.status = status || existingAttendance.status;
        if (notes) existingAttendance.notes = notes;
        
        await existingAttendance.save();

        return res.status(200).json({
            status: 'success',
            message: 'Attendance updated successfully',
            data: existingAttendance
        });
    }

    // Create new attendance record
    const attendanceData = {
        teacher: teacherId,
        attendanceType: 'teacher',
        attendanceMethod: 'mobile',
        status: status || 'present',
        academicYear: academicYear,
        date: today,
        timeIn: new Date(),
        deviceInfo: {
            deviceId: 'mobile-app',
            deviceType: 'mobile',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        },
        notes
    };

    const attendance = new Attendance(attendanceData);
    await attendance.save();

    res.status(201).json({
        status: 'success',
        message: 'Attendance marked successfully',
        data: attendance
    });
});

// Get teacher's classes (for attendance marking)
exports.getMyTeacherClasses = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    // Get current academic year
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }

    const academicYearId = currentSettings.academicYear._id;

    // Get all GradeSubjects where this teacher is assigned
    const gradeSubjects = await GradeSubject.find({
        teacher: teacherId,
        academicYear: academicYearId,
        Status: 'active'
    })
    .populate('grade', 'gradeName')
    .populate('section', 'sectionName')
    .populate('subject', 'subjectName')
    .lean();

    if (gradeSubjects.length === 0) {
        return res.status(200).json({
            status: 'success',
            data: {
                classes: []
            }
        });
    }

    // Group by unique class (grade + gender + section)
    const classMap = new Map();
    
    gradeSubjects.forEach(gs => {
        const gradeId = gs.grade._id.toString();
        const sectionId = gs.section._id.toString();
        const gender = gs.gender;
        const key = `${gradeId}::${sectionId}::${gender}`;
        
        if (!classMap.has(key)) {
            classMap.set(key, {
                _id: key,
                grade: {
                    _id: gs.grade._id,
                    gradeName: gs.grade.gradeName
                },
                section: {
                    _id: gs.section._id,
                    sectionName: gs.section.sectionName
                },
                gender: gender,
                subjects: []
            });
        }
        
        const classEntry = classMap.get(key);
        if (gs.subject && !classEntry.subjects.some(s => s._id.toString() === gs.subject._id.toString())) {
            classEntry.subjects.push({
                _id: gs.subject._id,
                subjectName: gs.subject.subjectName
            });
        }
    });

    // Convert to array and format
    const classes = Array.from(classMap.values()).map(cls => ({
        ...cls,
        displayName: `${cls.grade.gradeName} - ${cls.section.sectionName} (${cls.gender})`,
        gradeId: cls.grade._id.toString(),
        sectionId: cls.section._id.toString()
    }));

    res.status(200).json({
        status: 'success',
        data: {
            classes: classes.sort((a, b) => {
                // Sort by grade name, then section name, then gender
                if (a.grade.gradeName !== b.grade.gradeName) {
                    return a.grade.gradeName.localeCompare(b.grade.gradeName);
                }
                if (a.section.sectionName !== b.section.sectionName) {
                    return a.section.sectionName.localeCompare(b.section.sectionName);
                }
                return a.gender.localeCompare(b.gender);
            })
        }
    });
});

// Get students for attendance marking (for classes teacher teaches)
exports.getMyTeacherStudentsForAttendance = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    const { grade, gender, section } = req.query;

    if (!grade || !gender || !section) {
        return res.status(400).json({
            status: 'error',
            message: 'Grade, gender, and section are required'
        });
    }

    // Verify teacher teaches this class
    const gradeSubject = await GradeSubject.findOne({
        teacher: teacherId,
        grade: grade,
        gender: gender,
        section: section,
        Status: 'active'
    });

    if (!gradeSubject) {
        return res.status(403).json({
            status: 'error',
            message: 'You do not have permission to mark attendance for this class'
        });
    }

    // Get current academic year
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }

    const academicYear = currentSettings.academicYear._id;

    // Get students for this class
    const AcademicStudent = require('../../models/users/AcademicStudent');
    const students = await AcademicStudent.find({
        academicYear: academicYear,
        grade: grade,
        gender: gender,
        section: section,
        status: 'active'
    })
    .populate('studentId', 'studentName studentID image phoneNumber _id')
    .select('studentId _id')
    .sort({ 'studentId.studentName': 1 })
    .lean();

    // Transform the data
    const formattedStudents = students.map(student => ({
        _id: student.studentId._id,
        studentName: student.studentId.studentName,
        studentID: student.studentId.studentID,
        image: student.studentId.image,
        phoneNumber: student.studentId.phoneNumber
    }));

    res.status(200).json({
        status: 'success',
        message: 'Students retrieved successfully',
        data: formattedStudents,
        count: formattedStudents.length
    });
});

// Mark student attendance (bulk)
exports.markMyTeacherStudentAttendance = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    const { attendanceData, date, grade, gender, section } = req.body;

    if (!attendanceData || !Array.isArray(attendanceData)) {
        return res.status(400).json({
            status: 'error',
            message: 'Attendance data array is required'
        });
    }

    if (!date || !grade || !gender || !section) {
        return res.status(400).json({
            status: 'error',
            message: 'Date, grade, gender, and section are required'
        });
    }

    // Verify teacher teaches this class
    const gradeSubject = await GradeSubject.findOne({
        teacher: teacherId,
        grade: grade,
        gender: gender,
        section: section,
        Status: 'active'
    });

    if (!gradeSubject) {
        return res.status(403).json({
            status: 'error',
            message: 'You do not have permission to mark attendance for this class'
        });
    }

    // Get current academic year
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }

    const academicYear = currentSettings.academicYear._id;

    const Attendance = require('../../models/Attendance/Attendance');
    const attendanceRecords = [];
    const errors = [];

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    for (const record of attendanceData) {
        try {
            // Check if attendance already exists for this student and date
            const existingAttendance = await Attendance.findOne({
                student: record.studentId,
                date: { $gte: attendanceDate, $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000) },
                attendanceType: 'student',
                isActive: true
            });

            if (existingAttendance) {
                // Update existing attendance
                existingAttendance.status = record.status || 'present';
                existingAttendance.attendanceMethod = 'web';
                existingAttendance.notes = record.notes;
                existingAttendance.verifiedBy = req.user._id;
                existingAttendance.verifiedAt = new Date();
                await existingAttendance.save();
                attendanceRecords.push(existingAttendance);
            } else {
                // Create new attendance record
                const newAttendance = new Attendance({
                    student: record.studentId,
                    attendanceType: 'student',
                    attendanceMethod: 'web',
                    status: record.status || 'present',
                    academicYear: academicYear,
                    grade: grade,
                    date: attendanceDate,
                    timeIn: new Date(),
                    deviceInfo: {
                        deviceId: 'web-teacher-app',
                        deviceType: 'web',
                        ipAddress: req.ip,
                        userAgent: req.headers['user-agent']
                    },
                    notes: record.notes,
                    verifiedBy: req.user._id,
                    verifiedAt: new Date()
                });
                await newAttendance.save();
                attendanceRecords.push(newAttendance);
            }
        } catch (error) {
            errors.push({
                studentId: record.studentId,
                error: error.message
            });
        }
    }

    res.status(200).json({
        status: 'success',
        message: `Successfully marked ${attendanceRecords.length} attendance records`,
        data: {
            success: attendanceRecords.length,
            errors: errors.length,
            errorDetails: errors
        }
    });
});

// Get student attendance report for teacher's classes
exports.getMyTeacherStudentAttendanceReport = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    const { fromDate, toDate, grade, gender, section } = req.query;

    if (!fromDate || !toDate) {
        return res.status(400).json({
            status: 'error',
            message: 'From date and to date are required'
        });
    }

    // Verify teacher teaches this class if filters are provided
    if (grade && gender && section) {
        const gradeSubject = await GradeSubject.findOne({
            teacher: teacherId,
            grade: grade,
            gender: gender,
            section: section,
            Status: 'active'
        });

        if (!gradeSubject) {
            return res.status(403).json({
                status: 'error',
                message: 'You do not have permission to view attendance for this class'
            });
        }
    }

    // Get current academic year
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }

    const academicYear = currentSettings.academicYear._id;

    // Get all classes teacher teaches
    const teacherClasses = await GradeSubject.find({
        teacher: teacherId,
        academicYear: academicYear,
        Status: 'active'
    })
    .populate('grade', 'gradeName')
    .populate('section', 'sectionName')
    .lean();

    if (teacherClasses.length === 0) {
        return res.status(200).json({
            status: 'success',
            data: {
                classes: [],
                summary: {
                    totalStudents: 0,
                    totalPresentDays: 0,
                    totalAbsentDays: 0,
                    totalLateDays: 0,
                    overallAttendancePercentage: 0
                }
            }
        });
    }

    // Build query filters
    const gradeIds = grade ? [grade] : teacherClasses.map(tc => tc.grade._id.toString());
    const sectionIds = section ? [section] : teacherClasses.map(tc => tc.section._id.toString());
    const genders = gender ? [gender] : [...new Set(teacherClasses.map(tc => tc.gender))];

    const Attendance = require('../../models/Attendance/Attendance');
    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);

    // Get attendance records
    const attendanceRecords = await Attendance.find({
        date: { $gte: start, $lte: end },
        attendanceType: 'student',
        academicYear: academicYear,
        grade: { $in: gradeIds },
        isActive: true
    })
    .populate('student', 'studentName studentID')
    .populate('grade', 'gradeName')
    .lean();

    // Filter by section and gender through AcademicStudent
    const AcademicStudent = require('../../models/users/AcademicStudent');
    const studentIds = [...new Set(attendanceRecords.map(ar => ar.student._id.toString()))];
    
    const academicStudentQuery = {
        studentId: { $in: studentIds },
        academicYear: academicYear,
        grade: { $in: gradeIds },
        section: { $in: sectionIds },
        gender: { $in: genders },
        status: 'active'
    };

    const academicStudents = await AcademicStudent.find(academicStudentQuery)
        .populate('section', 'sectionName')
        .lean();

    const academicStudentMap = new Map();
    academicStudents.forEach(as => {
        academicStudentMap.set(as.studentId.toString(), as);
    });

    // Filter attendance records
    const filteredAttendance = attendanceRecords.filter(record => {
        const studentId = record.student._id.toString();
        const academicStudent = academicStudentMap.get(studentId);
        if (!academicStudent) return false;
        
        // Apply filters
        if (section && academicStudent.section._id.toString() !== section) return false;
        if (gender && academicStudent.gender !== gender) return false;
        
        return true;
    });

    // Group by student
    const studentStats = {};
    filteredAttendance.forEach(record => {
        const studentId = record.student._id.toString();
        const academicStudent = academicStudentMap.get(studentId);
        
        if (!studentStats[studentId]) {
            studentStats[studentId] = {
                student: {
                    _id: record.student._id,
                    studentName: record.student.studentName,
                    studentID: record.student.studentID
                },
                grade: record.grade,
                section: academicStudent?.section,
                gender: academicStudent?.gender,
                totalDays: 0,
                presentDays: 0,
                absentDays: 0,
                lateDays: 0,
                attendanceRecords: []
            };
        }
        
        studentStats[studentId].totalDays++;
        studentStats[studentId].attendanceRecords.push({
            date: record.date,
            status: record.status,
            timeIn: record.timeIn
        });
        
        switch (record.status) {
            case 'present':
                studentStats[studentId].presentDays++;
                break;
            case 'absent':
                studentStats[studentId].absentDays++;
                break;
            case 'late':
                studentStats[studentId].lateDays++;
                break;
        }
    });

    // Calculate percentages
    const students = Object.values(studentStats).map(student => ({
        ...student,
        attendancePercentage: student.totalDays > 0 
            ? Math.round((student.presentDays / student.totalDays) * 100) 
            : 0
    }));

    // Calculate summary
    const totalStudents = students.length;
    const totalPresentDays = students.reduce((sum, s) => sum + s.presentDays, 0);
    const totalAbsentDays = students.reduce((sum, s) => sum + s.absentDays, 0);
    const totalLateDays = students.reduce((sum, s) => sum + s.lateDays, 0);
    const totalDays = students.reduce((sum, s) => sum + s.totalDays, 0);
    const overallAttendancePercentage = totalDays > 0 
        ? Math.round((totalPresentDays / totalDays) * 100) 
        : 0;

    res.status(200).json({
        status: 'success',
        data: {
            students: students.sort((a, b) => b.attendancePercentage - a.attendancePercentage),
            summary: {
                totalStudents,
                totalPresentDays,
                totalAbsentDays,
                totalLateDays,
                totalDays,
                overallAttendancePercentage
            },
            dateRange: {
                from: fromDate,
                to: toDate
            }
        }
    });
});

// Get teacher's assignments
exports.getMyTeacherAssignments = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }
    
    // Verify teacher exists
    const teacher = await Teacher.findById(teacherId).lean();
    if (!teacher) {
        return next(new AppError('Teacher not found', 404));
    }

    // Build query based on teacher's permissions
    const query = {
        status: 'active',
    };

    // Get teacher's grade permissions from GradePermissions collection
    const gradePermissions = await GradePermissions.find({ teacherId: teacherId })
        .populate('grade', 'gradeName')
        .lean();

    // Filter by teacher's grade permissions
    if (gradePermissions && gradePermissions.length > 0) {
        const gradeIds = gradePermissions.map(gp => {
            const grade = gp.grade;
            return grade && typeof grade === 'object' ? grade._id : grade;
        }).filter(id => id);
        if (gradeIds.length > 0) {
            query.grade = { $in: gradeIds };
        }
    }

    // Get teacher's subject permissions from SubjectPermissions collection
    const subjectPermissions = await SubjectPermissions.find({ teacher: teacherId })
        .populate('subjects', 'subjectName')
        .lean();

    // Filter by teacher's subject permissions
    if (subjectPermissions && subjectPermissions.length > 0) {
        const subjectIds = [];
        subjectPermissions.forEach(sp => {
            if (sp.subjects && Array.isArray(sp.subjects)) {
                sp.subjects.forEach(subject => {
                    const subjectId = subject && typeof subject === 'object' ? subject._id : subject;
                    if (subjectId) {
                        subjectIds.push(subjectId);
                    }
                });
            }
        });
        if (subjectIds.length > 0) {
            query.subjectId = { $in: [...new Set(subjectIds.map(id => id.toString()))] };
        }
    }

    // Apply additional filters from query params (these override permission filters)
    if (req.query.academicYear) {
        query.academicYear = req.query.academicYear;
    }
    if (req.query.term) {
        query.term = req.query.term;
    }
    if (req.query.grade) {
        query.grade = req.query.grade;
    }
    if (req.query.subjectId) {
        query.subjectId = req.query.subjectId;
    }

    const assignments = await Assignment.find(query)
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('subjectId', 'subjectName')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({
        status: 'success',
        data: assignments
    });
});

// Get teacher's assignment by ID
exports.getMyTeacherAssignmentById = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    const Assignment = require('../../models/Assignments/Assignment');
    const PublishAssignment = require('../../models/Assignments/Publish');
    
    const assignment = await Assignment.findById(req.params.id)
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('subjectId', 'subjectName')
        .populate('createdBy', 'name')
        .lean();

    if (!assignment) {
        return next(new AppError('Assignment not found', 404));
    }

    // Get published assignments for this assignment
    const publishedAssignments = await PublishAssignment.find({ assignment: req.params.id })
        .populate({
            path: 'assignment',
            populate: {
                path: 'subjectId',
                select: 'subjectName'
            }
        })
        .populate('grade', 'gradeName')
        .populate('section', 'sectionName')
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({
        status: 'success',
        data: {
            ...assignment,
            publishedAssignments
        }
    });
});

// Create teacher's assignment
exports.createMyTeacherAssignment = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }
    
    // Get current academic year from settings
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }
    const academicYearId = currentSettings.academicYear._id;

    // Verify teacher has permission for this grade and subject
    // Check GradePermissions first
    let hasGradePermission = false;
    const gradePermissions = await GradePermissions.find({ 
        teacherId: teacherId,
        academicYear: academicYearId,
        grade: req.body.grade
    });
    if (gradePermissions && gradePermissions.length > 0) {
        hasGradePermission = true;
    } else {
        // Check GradeSubject allocations
        const gradeSubjectForGrade = await GradeSubject.findOne({
            teacher: teacherId,
            academicYear: academicYearId,
            grade: req.body.grade,
            Status: 'active'
        });
        hasGradePermission = !!gradeSubjectForGrade;
    }

    // Check SubjectPermissions first
    let hasSubjectPermission = false;
    const subjectPermissions = await SubjectPermissions.find({
        teacher: teacherId,
        academicYear: academicYearId,
        grade: req.body.grade,
        subjects: req.body.subjectId
    });
    if (subjectPermissions && subjectPermissions.length > 0) {
        hasSubjectPermission = true;
    } else {
        // Check GradeSubject allocations
        const gradeSubjectForSubject = await GradeSubject.findOne({
            teacher: teacherId,
            academicYear: academicYearId,
            grade: req.body.grade,
            subject: req.body.subjectId,
            Status: 'active'
        });
        hasSubjectPermission = !!gradeSubjectForSubject;
    }

    

    if (!hasGradePermission || !hasSubjectPermission) {
        return next(new AppError('You do not have permission to create assignments for this grade/subject', 403));
    }

    // Handle file upload if provided
    let filePath;
    if (req.body.questionFile && (req.body.questionFile.includes('data:image') || req.body.questionFile.includes('data:application/pdf'))) {
        const fs = require('fs');
        const path = require('path');
        
        let matches;
        if (req.body.questionFile.includes('data:image')) {
            matches = req.body.questionFile.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        } else {
            matches = req.body.questionFile.match(/^data:application\/([a-zA-Z]+);base64,(.+)$/);
        }

        if (matches && matches.length === 3) {
            const fileType = matches[1];
            const fileData = matches[2];
            const fileName = `question_${Date.now()}.${fileType}`;
            const buffer = Buffer.from(fileData, 'base64');
            const savePath = path.join(__dirname, '..', '..', 'public', 'uploads', 'assignment', fileName);

            if (!fs.existsSync(path.dirname(savePath))) {
                fs.mkdirSync(path.dirname(savePath), { recursive: true });
            }

            fs.writeFileSync(savePath, buffer);
            filePath = `uploads/assignment/${fileName}`;
        }
    }

    const newAssignment = await Assignment.create({
        assignmentName: req.body.assignmentName,
        academicYear: req.body.academicYear,
        grade: req.body.grade,
        term: req.body.term,
        subjectId: req.body.subjectId,
        question: req.body.question,
        questionFile: filePath,
        status: 'active',
        createdBy: req.user._id,
    });

    const populatedAssignment = await Assignment.findById(newAssignment._id)
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('subjectId', 'subjectName')
        .populate('createdBy', 'name')
        .lean();

    res.status(201).json({
        status: 'success',
        data: populatedAssignment
    });
});

// Update teacher's assignment
exports.updateMyTeacherAssignment = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }
    
    // Check if assignment exists and belongs to teacher
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
        return next(new AppError('Assignment not found', 404));
    }

    // Verify teacher created this assignment
    if (assignment.createdBy.toString() !== req.user._id.toString()) {
        return next(new AppError('You can only update your own assignments', 403));
    }

    // Handle file upload if provided
    if (req.body.questionFile && (req.body.questionFile.includes('data:image') || req.body.questionFile.includes('data:application/pdf'))) {
        const fs = require('fs');
        const path = require('path');
        
        let matches;
        if (req.body.questionFile.includes('data:image')) {
            matches = req.body.questionFile.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        } else {
            matches = req.body.questionFile.match(/^data:application\/([a-zA-Z]+);base64,(.+)$/);
        }

        if (matches && matches.length === 3) {
            const fileType = matches[1];
            const fileData = matches[2];
            const fileName = `question_${Date.now()}.${fileType}`;
            const buffer = Buffer.from(fileData, 'base64');
            const savePath = path.join(__dirname, '..', '..', 'public', 'uploads', 'assignment', fileName);

            if (!fs.existsSync(path.dirname(savePath))) {
                fs.mkdirSync(path.dirname(savePath), { recursive: true });
            }

            fs.writeFileSync(savePath, buffer);
            req.body.questionFile = `uploads/assignment/${fileName}`;
        }
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    )
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('subjectId', 'subjectName')
        .populate('createdBy', 'name')
        .lean();

    res.status(200).json({
        status: 'success',
        data: updatedAssignment
    });
});

// Delete teacher's assignment
exports.deleteMyTeacherAssignment = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }
    
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
        return next(new AppError('Assignment not found', 404));
    }

    // Verify teacher created this assignment
    if (assignment.createdBy.toString() !== req.user._id.toString()) {
        return next(new AppError('You can only delete your own assignments', 403));
    }

    // Check if there are any published assignments
    const publishedAssignments = await PublishAssignment.find({ assignment: req.params.id });
    if (publishedAssignments.length > 0) {
        return next(new AppError(`Cannot delete assignment. This assignment has been published ${publishedAssignments.length} time(s). Please delete the published assignments first.`, 400));
    }

    await Assignment.findByIdAndDelete(req.params.id);

    res.status(200).json({
        status: 'success',
        data: null
    });
});

// Publish teacher's assignment
exports.publishMyTeacherAssignment = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }
    
    const assignmentId = req.params.id;
    const { gender, sections, startDate, endDate } = req.body;

    // Verify assignment exists and belongs to teacher
    const assignmentData = await Assignment.findById(assignmentId);
    if (!assignmentData) {
        return next(new AppError('Assignment not found', 404));
    }

    if (assignmentData.createdBy.toString() !== req.user._id.toString()) {
        return next(new AppError('You can only publish your own assignments', 403));
    }

    const grade = assignmentData.grade;

    // Publish for each section
    const results = await Promise.all(sections.map(async (sec) => {
        const isPublished = await PublishAssignment.findOne({ assignment: assignmentId, grade, gender, section: sec });
        if (isPublished) {
            throw new AppError('Assignment already published for the given section', 400);
        }

        const students = await AcademicStudent.find({
            academicYear: assignmentData.academicYear,
            grade: grade,
            gender: gender,
            section: sec,
            status: 'active',
        }).select('studentId');

        if (!students || students.length === 0) {
            const sectionDetails = await Section.findById(sec);
            throw new AppError(`No students found in ${sectionDetails?.sectionName}`, 404);
        }

        const newPublish = await PublishAssignment.create({
            assignment: assignmentId,
            gender,
            section: sec,
            startDate,
            endDate,
            totalUsersSelected: students.length,
            grade,
            createdBy: req.user._id
        });

        const attemptsToCreate = students.map(student => ({
            studentId: student.studentId,
            publishId: newPublish._id
        }));

        await StudentAssignmentAttempt.insertMany(attemptsToCreate);
        return newPublish;
    }));

    res.status(201).json({
        status: 'success',
        data: results[0]
    });
});

// Delete teacher's published assignment
exports.deleteMyTeacherPublishedAssignment = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }
    
    const publishedAssignment = await PublishAssignment.findById(req.params.publishId);
    if (!publishedAssignment) {
        return next(new AppError('Published assignment not found', 404));
    }

    // Verify teacher created this published assignment
    if (publishedAssignment.createdBy.toString() !== req.user._id.toString()) {
        return next(new AppError('You can only delete your own published assignments', 403));
    }

    // Delete student attempts
    await StudentAssignmentAttempt.deleteMany({ publishId: req.params.publishId });

    // Delete published assignment
    await PublishAssignment.findByIdAndDelete(req.params.publishId);

    res.status(200).json({
        status: 'success',
        data: null
    });
});

// Get not published sections for teacher
exports.getMyTeacherNotPublishedSections = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }
    
    const assignment = await Assignment.findById(req.params.id).populate('academicYear');
    if (!assignment) {
        return next(new AppError('Assignment not found', 404));
    }

    const { gender } = req.query;
    const academicYearId = assignment.academicYear?._id || assignment.academicYear;

    // Get teacher's sections - check SubjectPermissions first, then fallback to GradeSubject
    let availableSections = [];
    
    // Check SubjectPermissions collection for this academic year, grade, and teacher
    const subjectPermissions = await SubjectPermissions.find({
        academicYear: academicYearId,
        teacher: teacherId,
        grade: assignment.grade,
        gender: gender
    })
        .select('section')
        .lean();

    if (subjectPermissions && subjectPermissions.length > 0) {
        // Extract section IDs from SubjectPermissions
        const sectionIds = subjectPermissions.map(sp => {
            const section = sp.section;
            return section && typeof section === 'object' ? section._id.toString() : section.toString();
        }).filter(id => id);
        availableSections = [...new Set(sectionIds)];
    }
    
    // If no sections from SubjectPermissions, fallback to GradeSubject
    if (availableSections.length === 0) {
        const gradeSubjects = await GradeSubject.find({
            academicYear: academicYearId,
            teacher: teacherId,
            grade: assignment.grade,
            gender: gender,
            Status: 'active'
        })
            .select('section')
            .lean();

            // console.log({gradeSubjects, academicYearId, teacherId, assignment, gender})

        if (gradeSubjects && gradeSubjects.length > 0) {
            // Extract section IDs from GradeSubject
            const sectionIds = gradeSubjects.map(gs => {
                const section = gs.section;
                return section && typeof section === 'object' ? section._id.toString() : section.toString();
            }).filter(id => id);
            availableSections = [...new Set(sectionIds)];
        }
    }

    // Get already published sections
    const publishedSections = await PublishAssignment.find({
        assignment: req.params.id,
        grade: assignment.grade,
        gender: gender
    }).select('section');

    const publishedSectionIds = publishedSections.map(ps => ps.section.toString());
    
    // Filter out published sections
    const notPublishedSections = availableSections.filter(sectionId => 
        !publishedSectionIds.includes(sectionId.toString())
    );

    // Get section details
    const sections = await Section.find({ _id: { $in: notPublishedSections } })
        .select('_id sectionName')
        .lean();

    res.status(200).json({
        status: 'success',
        data: sections
    });
});

// Get teacher's published assignment details by publishId
exports.getMyTeacherPublishedAssignmentDetails = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }
    
    const publishedAssignment = await PublishAssignment.findById(req.params.publishId)
        .populate('assignment', 'assignmentName subjectId')
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('section', 'sectionName')
        .populate('createdBy', 'name')
        .lean();

    if (!publishedAssignment) {
        return next(new AppError('Published assignment not found', 404));
    }

    // Verify teacher created this published assignment
    if (publishedAssignment.createdBy._id.toString() !== req.user._id.toString()) {
        return next(new AppError('You can only view your own published assignments', 403));
    }

    res.status(200).json({
        status: 'success',
        data: publishedAssignment
    });
});

// Get teacher's published assignments
exports.getMyTeacherPublishedAssignments = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }
    
    // Verify teacher exists
    const teacher = await Teacher.findById(teacherId).lean();
    if (!teacher) {
        return next(new AppError('Teacher not found', 404));
    }

    // Get teacher's grade permissions from GradePermissions collection
    const gradePermissions = await GradePermissions.find({ teacherId: teacherId })
        .populate('grade', 'gradeName')
        .lean();

    // Build query based on teacher's permissions
    const query = {};

    // Filter by teacher's grade permissions
    if (gradePermissions && gradePermissions.length > 0) {
        const gradeIds = gradePermissions.map(gp => {
            const grade = gp.grade;
            return grade && typeof grade === 'object' ? grade._id : grade;
        }).filter(id => id);
        if (gradeIds.length > 0) {
            query.grade = { $in: gradeIds };
        }
    }

    // Apply additional filters from query params
    if (req.query.assignmentId) {
        query.assignment = req.query.assignmentId;
    }
    if (req.query.grade) {
        query.grade = req.query.grade;
    }
    if (req.query.gender) {
        query.gender = req.query.gender;
    }
    if (req.query.section) {
        query.section = req.query.section;
    }

    const publishedAssignments = await PublishAssignment.find(query)
        .populate({
            path: 'assignment',
            populate: [
                {
                    path: 'subjectId',
                    select: 'subjectName'
                },
                {
                    path: 'grade',
                    select: 'gradeName'
                },
                {
                    path: 'academicYear',
                    select: 'academicYear'
                }
            ]
        })
        .populate('grade', 'gradeName')
        .populate('section', 'sectionName')
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({
        status: 'success',
        data: publishedAssignments
    });
});

// Get teacher's available academic years
exports.getMyTeacherAcademicYears = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    // Get all academic years from GradeSubjects where this teacher is assigned
    const AcademicYear = require('../../models/Admin/AcademicYear');
    const gradeSubjects = await GradeSubject.find({ 
        teacher: teacherId,
        Status: 'active'
    }).distinct('academicYear');

    if (gradeSubjects.length === 0) {
        return res.status(200).json({
            status: 'success',
            results: 0,
            data: []
        });
    }

    // Get academic years with terms
    const academicYears = await AcademicYear.find({ 
        _id: { $in: gradeSubjects }
    }).select('academicYear terms').lean();

    res.status(200).json({
        status: 'success',
        results: academicYears.length,
        data: academicYears
    });
});

// Get teacher's available grades
exports.getMyTeacherGrades = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    // Get current academic year from settings
    const currentSettings = await Settings.findOne();
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }

    const academicYear = req.query.academicYear || currentSettings.academicYear;

    // Check Grade Permissions first
    const gradePermissions = await GradePermissions.find({ 
        academicYear: academicYear, 
        teacherId: teacherId
    }).populate('grade', 'gradeName').lean();

    if (gradePermissions && gradePermissions.length > 0) {
        const grades = gradePermissions.map(gp => gp.grade).filter(g => g);
        return res.status(200).json({
            status: 'success',
            results: grades.length,
            data: grades
        });
    }

    // If no permissions, check GradeSubject where teacher is allocated
    const gradeSubjectGrades = await GradeSubject.distinct('grade', { 
        academicYear: academicYear, 
        teacher: teacherId, 
        Status: 'active' 
    });

    if (gradeSubjectGrades.length === 0) {
        return res.status(200).json({
            status: 'success',
            results: 0,
            data: []
        });
    }

    const Grade = require('../../models/Admin/Grade');
    const grades = await Grade.find({ 
        _id: { $in: gradeSubjectGrades },
        status: 'Active'
    }).select('gradeName').lean();

    res.status(200).json({
        status: 'success',
        results: grades.length,
        data: grades
    });
});

// Get teacher's available subjects
exports.getMyTeacherSubjects = catchAsync(async (req, res, next) => {
    // Get current academic year from settings
    let academicYear = req.query.academicYear;
    if (!academicYear) {
        const currentSettings = await Settings.findOne().populate('academicYear');
        if (!currentSettings) {
            return next(new AppError('System settings not configured', 500));
        }
        // Use the academicYear ID from settings
        academicYear = currentSettings.academicYear?._id || currentSettings.academicYear;
    }
    const grade = req.query.grade;

    if (!grade) {
        return next(new AppError('Grade is required', 400));
    }

    // If user is admin, return all subjects for the grade
    if (req.user && req.user.role === 'admin') {
        const GradeSubject = require('../../models/Admin/GradeSubject');
        const gradeSubjectSubjects = await GradeSubject.distinct('subject', { 
            academicYear: academicYear,
            grade: grade,
            Status: 'active'
        });

        if (gradeSubjectSubjects.length === 0) {
            return res.status(200).json({
                status: 'success',
                results: 0,
                data: []
            });
        }

        const Subject = require('../../models/Admin/Subject');
        const subjects = await Subject.find({ 
            _id: { $in: gradeSubjectSubjects }
        }).select('subjectName').lean();

        return res.status(200).json({
            status: 'success',
            results: subjects.length,
            data: subjects
        });
    }

    // For non-admin users, check teacher permissions
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    // Check Subject Permissions first
    const subjectPermissions = await SubjectPermissions.find({ 
        academicYear: academicYear,
        grade: grade,
        teacher: teacherId
    }).select('subjects').lean();

    if (subjectPermissions && subjectPermissions.length > 0) {
        const mergedSubjects = subjectPermissions.flatMap(sp => sp.subjects || []);
        const uniqueSubjects = [...new Set(mergedSubjects.map(s => s.toString()))];

        if (uniqueSubjects.length > 0) {
            const Subject = require('../../models/Admin/Subject');
            const subjects = await Subject.find({ 
                _id: { $in: uniqueSubjects }
            }).select('subjectName').lean();

            return res.status(200).json({
                status: 'success',
                results: subjects.length,
                data: subjects
            });
        }
    }

    // If no permissions, check GradeSubject where teacher is allocated
    const gradeSubjectSubjects = await GradeSubject.distinct('subject', { 
        academicYear: academicYear,
        grade: grade,
        teacher: teacherId,
        Status: 'active'
    });

    if (gradeSubjectSubjects.length === 0) {
        return res.status(200).json({
            status: 'success',
            results: 0,
            data: []
        });
    }

    const Subject = require('../../models/Admin/Subject');
    const subjects = await Subject.find({ 
        _id: { $in: gradeSubjectSubjects }
    }).select('subjectName').lean();

    res.status(200).json({
        status: 'success',
        results: subjects.length,
        data: subjects
    });
});

// Get student attempts for a published assignment
exports.getMyTeacherPublishedAssignmentStudents = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    const { publishId } = req.params;

    // Verify the published assignment exists and belongs to this teacher
    const publishedAssignment = await PublishAssignment.findById(publishId)
        .populate({
            path: 'assignment',
            populate: {
                path: 'grade',
                select: 'gradeName'
            }
        })
        .populate('section', 'sectionName')
        .lean();

    if (!publishedAssignment) {
        return next(new AppError('Published assignment not found', 404));
    }

    // Verify teacher has permission for this assignment's grade and subject
    const assignment = await Assignment.findById(publishedAssignment.assignment._id)
        .populate('subjectId', 'subjectName')
        .lean();

    if (!assignment) {
        return next(new AppError('Assignment not found', 404));
    }

    // Get current academic year from settings
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }
    const academicYearId = currentSettings.academicYear._id;

    // Check if teacher has permission for this grade and subject
    let hasPermission = false;
    
    // Check GradePermissions
    const gradePermissions = await GradePermissions.find({ 
        teacherId: teacherId,
        academicYear: academicYearId,
        grade: assignment.grade
    });
    
    if (gradePermissions && gradePermissions.length > 0) {
        // Check SubjectPermissions
        const subjectPermissions = await SubjectPermissions.find({
            teacher: teacherId,
            academicYear: academicYearId,
            grade: assignment.grade,
            subjects: assignment.subjectId._id
        });
        hasPermission = subjectPermissions && subjectPermissions.length > 0;
    }
    
    // If no explicit permissions, check GradeSubject allocations
    if (!hasPermission) {
        const gradeSubject = await GradeSubject.findOne({
            teacher: teacherId,
            academicYear: academicYearId,
            grade: assignment.grade,
            subject: assignment.subjectId._id,
            Status: 'active'
        });
        hasPermission = !!gradeSubject;
    }

    if (!hasPermission) {
        return next(new AppError('You do not have permission to view this assignment', 403));
    }

    // Get all student attempts for this published assignment
    const attempts = await StudentAssignmentAttempt.find({ publishId })
        .populate({
            path: 'studentId',
            select: 'studentID studentName email phone',
            populate: {
                path: 'userId',
                select: 'name email'
            }
        })
        .sort({ createdAt: -1 })
        .lean();

    // Format the response
    const students = attempts.map(attempt => ({
        _id: attempt._id,
        studentId: attempt.studentId?._id,
        studentID: attempt.studentId?.studentID,
        studentName: attempt.studentId?.studentName || attempt.studentId?.userId?.name,
        email: attempt.studentId?.email || attempt.studentId?.userId?.email,
        phone: attempt.studentId?.phone,
        attendedStatus: attempt.attendedStatus,
        attendedDate: attempt.attendedDate,
        studentAnswer: attempt.studentAnswer,
        studentAttachment: attempt.studentAttachment,
        teacherRemarks: attempt.teacherRemarks,
        createdAt: attempt.createdAt,
        updatedAt: attempt.updatedAt,
    }));

    // Calculate statistics
    const totalStudents = students.length;
    const attendedStudents = students.filter(s => s.attendedStatus).length;
    const pendingStudents = totalStudents - attendedStudents;

    res.status(200).json({
        status: 'success',
        data: {
            publishedAssignment: {
                _id: publishedAssignment._id,
                assignmentName: assignment.assignmentName,
                subjectName: assignment.subjectId?.subjectName,
                gradeName: assignment.grade?.gradeName,
                sectionName: publishedAssignment.section?.sectionName,
                gender: publishedAssignment.gender,
                startDate: publishedAssignment.startDate,
                endDate: publishedAssignment.endDate,
            },
            statistics: {
                total: totalStudents,
                attended: attendedStudents,
                pending: pendingStudents,
            },
            students: students,
        }
    });
});

// Update teacher remarks for a student's assignment attempt
exports.updateMyTeacherStudentAssignmentRemarks = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    const { attemptId } = req.params;
    const { teacherRemarks } = req.body;

    if (teacherRemarks === undefined || teacherRemarks === null) {
        return next(new AppError('Teacher remarks are required', 400));
    }

    // Find the student's assignment attempt
    const attempt = await StudentAssignmentAttempt.findById(attemptId)
        .populate({
            path: 'publishId',
            populate: {
                path: 'assignment',
                populate: {
                    path: 'grade',
                    select: 'gradeName'
                }
            }
        })
        .lean();

    if (!attempt) {
        return next(new AppError('Assignment attempt not found', 404));
    }

    // Verify teacher has permission for this assignment
    const assignment = await Assignment.findById(attempt.publishId.assignment._id)
        .populate('subjectId', 'subjectName')
        .lean();

    if (!assignment) {
        return next(new AppError('Assignment not found', 404));
    }

    // Get current academic year from settings
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }
    const academicYearId = currentSettings.academicYear._id;

    // Check if teacher has permission for this grade and subject
    let hasPermission = false;
    
    // Check GradePermissions
    const gradePermissions = await GradePermissions.find({ 
        teacherId: teacherId,
        academicYear: academicYearId,
        grade: assignment.grade
    });
    
    if (gradePermissions && gradePermissions.length > 0) {
        // Check SubjectPermissions
        const subjectPermissions = await SubjectPermissions.find({
            teacher: teacherId,
            academicYear: academicYearId,
            grade: assignment.grade,
            subjects: assignment.subjectId._id
        });
        hasPermission = subjectPermissions && subjectPermissions.length > 0;
    }
    
    // If no explicit permissions, check GradeSubject allocations
    if (!hasPermission) {
        const gradeSubject = await GradeSubject.findOne({
            teacher: teacherId,
            academicYear: academicYearId,
            grade: assignment.grade,
            subject: assignment.subjectId._id,
            Status: 'active'
        });
        hasPermission = !!gradeSubject;
    }

    if (!hasPermission) {
        return next(new AppError('You do not have permission to update remarks for this assignment', 403));
    }

    // Update teacher remarks
    const updatedAttempt = await StudentAssignmentAttempt.findByIdAndUpdate(
        attemptId,
        {
            teacherId: teacherId,
            teacherRemarks: teacherRemarks || '',
        },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        status: 'success',
        message: 'Teacher remarks updated successfully',
        data: updatedAttempt
    });
});

// ==================== ONLINE EXAM ENDPOINTS ====================

// Get teacher's online exams
exports.getMyTeacherExams = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }
    
    // Verify teacher exists
    const teacher = await Teacher.findById(teacherId).lean();
    if (!teacher) {
        return next(new AppError('Teacher not found', 404));
    }

    // Build query based on teacher's permissions
    const query = {
        status: 'active',
    };

    // Get teacher's grade permissions from GradePermissions collection
    const gradePermissions = await GradePermissions.find({ teacherId: teacherId })
        .populate('grade', 'gradeName')
        .lean();

    // Filter by teacher's grade permissions
    if (gradePermissions && gradePermissions.length > 0) {
        const gradeIds = gradePermissions.map(gp => {
            const grade = gp.grade;
            return grade && typeof grade === 'object' ? grade._id : grade;
        }).filter(id => id);
        if (gradeIds.length > 0) {
            query.grade = { $in: gradeIds };
        }
    }

    // Get teacher's subject permissions from SubjectPermissions collection
    const subjectPermissions = await SubjectPermissions.find({ teacher: teacherId })
        .populate('subjects', 'subjectName')
        .lean();

    // Filter by teacher's subject permissions
    if (subjectPermissions && subjectPermissions.length > 0) {
        const subjectIds = [];
        subjectPermissions.forEach(sp => {
            if (sp.subjects && Array.isArray(sp.subjects)) {
                sp.subjects.forEach(subject => {
                    const subjectId = subject && typeof subject === 'object' ? subject._id : subject;
                    if (subjectId) {
                        subjectIds.push(subjectId);
                    }
                });
            }
        });
        if (subjectIds.length > 0) {
            query.subjectId = { $in: [...new Set(subjectIds.map(id => id.toString()))] };
        }
    }

    // Apply additional filters from query params
    if (req.query.academicYear) {
        query.academicYear = req.query.academicYear;
    }
    if (req.query.term) {
        query.term = req.query.term;
    }
    if (req.query.grade) {
        query.grade = req.query.grade;
    }
    if (req.query.subjectId) {
        query.subjectId = req.query.subjectId;
    }

    const exams = await OnlineExam.find(query)
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('subjectId', 'subjectName')
        .populate('createdBy', 'name')
        .populate('publishCount')
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({
        status: 'success',
        results: exams.length,
        data: exams
    });
});

// Get teacher's exam by ID
exports.getMyTeacherExamById = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    const exam = await OnlineExam.findById(req.params.id)
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('subjectId', 'subjectName')
        .populate('createdBy', 'name')
        .populate('publishCount')
        .lean();

    if (!exam) {
        return next(new AppError('Exam not found', 404));
    }

    // Get all published exams for this exam
    const publishedExams = await Publish.find({ exam: exam._id })
        .populate('section', 'sectionName')
        .populate('questionBank', 'questionBankName')
        .populate('grade', 'gradeName')
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({
        status: 'success',
        data: {
            ...exam,
            publishedExams: publishedExams || []
        }
    });
});

// Create teacher's exam
exports.createMyTeacherExam = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }
    
    // Get current academic year from settings
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }
    const academicYearId = currentSettings.academicYear._id;

    // Verify teacher has permission for this grade and subject
    // Check GradePermissions first
    let hasGradePermission = false;
    const gradePermissions = await GradePermissions.find({ 
        teacherId: teacherId,
        academicYear: academicYearId,
        grade: req.body.grade
    });
    if (gradePermissions && gradePermissions.length > 0) {
        hasGradePermission = true;
    } else {
        // Check GradeSubject allocations
        const gradeSubjectForGrade = await GradeSubject.findOne({
            teacher: teacherId,
            academicYear: academicYearId,
            grade: req.body.grade,
            Status: 'active'
        });
        hasGradePermission = !!gradeSubjectForGrade;
    }

    // Check SubjectPermissions first
    let hasSubjectPermission = false;
    const subjectPermissions = await SubjectPermissions.find({
        teacher: teacherId,
        academicYear: academicYearId,
        grade: req.body.grade,
        subjects: req.body.subjectId
    });
    if (subjectPermissions && subjectPermissions.length > 0) {
        hasSubjectPermission = true;
    } else {
        // Check GradeSubject allocations
        const gradeSubjectForSubject = await GradeSubject.findOne({
            teacher: teacherId,
            academicYear: academicYearId,
            grade: req.body.grade,
            subject: req.body.subjectId,
            Status: 'active'
        });
        hasSubjectPermission = !!gradeSubjectForSubject;
    }

    if (!hasGradePermission || !hasSubjectPermission) {
        return next(new AppError('You do not have permission to create exams for this grade/subject combination', 403));
    }

    try {
        const newExam = await OnlineExam.create({
            examName: req.body.examName,
            academicYear: req.body.academicYear || academicYearId,
            grade: req.body.grade,
            term: req.body.term,
            subjectId: req.body.subjectId,
            createdBy: req.user._id,
        });

        const populatedExam = await OnlineExam.findById(newExam._id)
            .populate('academicYear', 'academicYear')
            .populate('grade', 'gradeName')
            .populate('subjectId', 'subjectName')
            .populate('createdBy', 'name')
            .lean();

        res.status(201).json({
            status: 'success',
            data: populatedExam
        });
    } catch (err) {
        if (err.code === 11000) {
            return next(new AppError('An exam with the same name already exists for the given academic year, grade, term, and subject', 400));
        }
        return next(err);
    }
});

// Update teacher's exam
exports.updateMyTeacherExam = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }
    
    // Check if exam exists and belongs to teacher
    const exam = await OnlineExam.findById(req.params.id);
    if (!exam) {
        return next(new AppError('Exam not found', 404));
    }

    // Verify teacher created this exam
    if (exam.createdBy.toString() !== req.user._id.toString()) {
        return next(new AppError('You can only update your own exams', 403));
    }

    const updatedExam = await OnlineExam.findByIdAndUpdate(
        req.params.id,
        {
            ...req.body,
            updatedBy: req.user._id,
        },
        { new: true, runValidators: true }
    )
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('subjectId', 'subjectName')
        .populate('createdBy', 'name')
        .lean();

    res.status(200).json({
        status: 'success',
        data: updatedExam
    });
});

// Delete teacher's exam
exports.deleteMyTeacherExam = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }
    
    const exam = await OnlineExam.findById(req.params.id);
    if (!exam) {
        return next(new AppError('Exam not found', 404));
    }

    // Verify teacher created this exam
    if (exam.createdBy.toString() !== req.user._id.toString()) {
        return next(new AppError('You can only delete your own exams', 403));
    }

    // Check if there are any published exams
    const publishedExams = await Publish.find({ exam: req.params.id });
    if (publishedExams.length > 0) {
        return next(new AppError(`Cannot delete exam. This exam has been published ${publishedExams.length} time(s). Please delete the published exams first.`, 400));
    }

    await OnlineExam.findByIdAndDelete(req.params.id);

    res.status(200).json({
        status: 'success',
        data: null
    });
});

// Get teacher's published exams
exports.getMyTeacherPublishedExams = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    // Build query based on teacher's permissions
    const query = {};

    // Get teacher's grade permissions
    const gradePermissions = await GradePermissions.find({ teacherId: teacherId })
        .populate('grade', 'gradeName')
        .lean();

    if (gradePermissions && gradePermissions.length > 0) {
        const gradeIds = gradePermissions.map(gp => {
            const grade = gp.grade;
            return grade && typeof grade === 'object' ? grade._id : grade;
        }).filter(id => id);
        if (gradeIds.length > 0) {
            query.grade = { $in: gradeIds };
        }
    }

    // Get teacher's subject permissions
    const subjectPermissions = await SubjectPermissions.find({ teacher: teacherId })
        .populate('subjects', 'subjectName')
        .lean();

    if (subjectPermissions && subjectPermissions.length > 0) {
        const subjectIds = [];
        subjectPermissions.forEach(sp => {
            if (sp.subjects && Array.isArray(sp.subjects)) {
                sp.subjects.forEach(subject => {
                    const subjectId = subject && typeof subject === 'object' ? subject._id : subject;
                    if (subjectId) {
                        subjectIds.push(subjectId);
                    }
                });
            }
        });
        if (subjectIds.length > 0) {
            // Get exams with these subjects
            const examsWithSubjects = await OnlineExam.find({ subjectId: { $in: [...new Set(subjectIds.map(id => id.toString()))] } }).select('_id').lean();
            const examIds = examsWithSubjects.map(e => e._id);
            if (examIds.length > 0) {
                query.exam = { $in: examIds };
            }
        }
    }

    // Apply filters from query params
    if (req.query.examId) {
        query.exam = req.query.examId;
    }
    if (req.query.grade) {
        query.grade = req.query.grade;
    }
    if (req.query.gender) {
        query.gender = req.query.gender;
    }
    if (req.query.section) {
        query.section = req.query.section;
    }

    const publishedExams = await Publish.find(query)
        .populate('exam', 'examName subjectId')
        .populate({
            path: 'exam',
            populate: {
                path: 'subjectId',
                select: 'subjectName'
            }
        })
        .populate('section', 'sectionName')
        .populate('questionBank', 'questionBankName')
        .populate('grade', 'gradeName')
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({
        status: 'success',
        results: publishedExams.length,
        data: publishedExams
    });
});

// Get teacher's published exam details
exports.getMyTeacherPublishedExamDetails = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    const publishedExam = await Publish.findById(req.params.publishId)
        .populate('exam', 'examName academicYear grade term subjectId')
        .populate({
            path: 'exam',
            populate: [
                { path: 'academicYear', select: 'academicYear' },
                { path: 'grade', select: 'gradeName' },
                { path: 'subjectId', select: 'subjectName' }
            ]
        })
        .populate('section', 'sectionName')
        .populate('questionBank', 'questionBankName')
        .populate('grade', 'gradeName')
        .lean();

    if (!publishedExam) {
        return next(new AppError('Published exam not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: publishedExam
    });
});

// Publish teacher's exam
exports.publishMyTeacherExam = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }
    
    const examId = req.params.id;
    const { questionBank, gender, sections, numberOfQuestions, duration, startDate, endDate } = req.body;

    // Verify exam exists and belongs to teacher
    const examData = await OnlineExam.findById(examId);
    if (!examData) {
        return next(new AppError('Exam not found', 404));
    }

    if (examData.createdBy.toString() !== req.user._id.toString()) {
        return next(new AppError('You can only publish your own exams', 403));
    }

    // Verify question bank exists
    const questionBankData = await QuestionBank.findById(questionBank);
    if (!questionBankData) {
        return next(new AppError('Question bank not found', 404));
    }

    // Get total questions in bank
    const totalQuestionsInBank = await Question.find({ questionBank }).countDocuments();
    if (numberOfQuestions > totalQuestionsInBank) {
        return next(new AppError(`Number of questions (${numberOfQuestions}) cannot exceed total questions in bank (${totalQuestionsInBank})`, 400));
    }

    const grade = examData.grade;

    // Publish for each section
    const results = await Promise.all(sections.map(async (sec) => {
        const isPublished = await Publish.findOne({ exam: examId, questionBank, grade, gender, section: sec });
        if (isPublished) {
            throw new AppError('Exam already published for the given section', 400);
        }

        const students = await AcademicStudent.find({
            academicYear: examData.academicYear,
            grade: grade,
            gender: gender,
            section: sec,
            status: 'active',
        }).select('studentId');

        if (!students || students.length === 0) {
            const sectionDetails = await Section.findById(sec);
            throw new AppError(`No students found in ${sectionDetails?.sectionName}`, 404);
        }

        const newPublish = await Publish.create({
            exam: examId,
            questionBank,
            gender,
            section: sec,
            numberOfQuestions,
            totalQuestionsInBank,
            duration,
            startDate,
            endDate,
            totalUsersSelected: students.length,
            grade,
            createdBy: req.user._id
        });

        const attemptsToCreate = students.map(student => ({
            studentId: student.studentId,
            publishId: newPublish._id,
            totalQuestions: numberOfQuestions,
        }));

        // Create student performance entries if they don't exist
        const performanceArray = [];
        await Promise.all(students.map(async (student) => {
            const existing = await StudentPerformance.findOne({ studentId: student.studentId, examId: examId });
            if (!existing) {
                performanceArray.push({ studentId: student.studentId, examId: examId });
            }
        }));

        await StudentExamAttempt.insertMany(attemptsToCreate);
        if (performanceArray.length > 0) {
            await StudentPerformance.insertMany(performanceArray);
        }

        return newPublish;
    }));

    res.status(201).json({
        status: 'success',
        data: results[0]
    });
});

// Delete teacher's published exam
exports.deleteMyTeacherPublishedExam = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }
    
    const publishedExam = await Publish.findById(req.params.publishId);
    if (!publishedExam) {
        return next(new AppError('Published exam not found', 404));
    }

    // Verify teacher created this published exam
    if (publishedExam.createdBy.toString() !== req.user._id.toString()) {
        return next(new AppError('You can only delete your own published exams', 403));
    }

    // Check if students have attempted this exam
    const attempts = await StudentExamAttempt.find({ publishId: req.params.publishId });
    if (attempts.length > 0) {
        return next(new AppError(`Cannot delete published exam. ${attempts.length} student(s) have attempted this exam.`, 400));
    }

    await Publish.findByIdAndDelete(req.params.publishId);

    res.status(200).json({
        status: 'success',
        data: null
    });
});

// Get not published sections for teacher's exam
exports.getMyTeacherNotPublishedExamSections = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }
    
    const exam = await OnlineExam.findById(req.params.id).populate('academicYear');
    if (!exam) {
        return next(new AppError('Exam not found', 404));
    }

    const { gender } = req.query;
    const academicYearId = exam.academicYear?._id || exam.academicYear;

    // Get teacher's sections - check SubjectPermissions first, then fallback to GradeSubject
    let availableSections = [];
    
    // Check SubjectPermissions collection for this academic year, grade, and teacher
    const subjectPermissions = await SubjectPermissions.find({
        academicYear: academicYearId,
        teacher: teacherId,
        grade: exam.grade,
        gender: gender
    })
        .select('section')
        .lean();

    if (subjectPermissions && subjectPermissions.length > 0) {
        // Extract section IDs from SubjectPermissions
        const sectionIds = subjectPermissions.map(sp => {
            const section = sp.section;
            return section && typeof section === 'object' ? section._id.toString() : section.toString();
        }).filter(id => id);
        availableSections = [...new Set(sectionIds)];
    }
    
    // If no sections from SubjectPermissions, fallback to GradeSubject
    if (availableSections.length === 0) {
        const gradeSubjects = await GradeSubject.find({
            academicYear: academicYearId,
            teacher: teacherId,
            grade: exam.grade,
            gender: gender,
            Status: 'active'
        })
            .select('section')
            .lean();

        if (gradeSubjects && gradeSubjects.length > 0) {
            // Extract section IDs from GradeSubject
            const sectionIds = gradeSubjects.map(gs => {
                const section = gs.section;
                return section && typeof section === 'object' ? section._id.toString() : section.toString();
            }).filter(id => id);
            availableSections = [...new Set(sectionIds)];
        }
    }

    // Get already published sections
    const publishedSections = await Publish.find({
        exam: req.params.id,
        grade: exam.grade,
        gender: gender
    }).select('section');

    const publishedSectionIds = publishedSections.map(ps => ps.section.toString());
    
    // Filter out published sections
    const notPublishedSections = availableSections.filter(sectionId => 
        !publishedSectionIds.includes(sectionId.toString())
    );

    // Get section details
    const sections = await Section.find({ _id: { $in: notPublishedSections } })
        .select('_id sectionName')
        .lean();

    res.status(200).json({
        status: 'success',
        data: sections
    });
});

// Get teacher's question banks
exports.getMyTeacherQuestionBanks = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    const { subjectId } = req.query;
    
    // Get current academic year from settings
    const currentSettings = await Settings.findOne();
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }
    const academicYearId = currentSettings.academicYear;

    // Get teacher's assigned subjects from GradeSubject
    const gradeSubjects = await GradeSubject.find({
        teacher: teacherId,
        academicYear: academicYearId,
        Status: 'active'
    }).select('subject').lean();

    // Get unique subject IDs
    const teacherSubjectIds = [...new Set(gradeSubjects.map(gs => {
        const subject = gs.subject;
        return subject && typeof subject === 'object' ? subject._id.toString() : subject.toString();
    }).filter(id => id))];

    // Also check SubjectPermissions for additional subjects
    const SubjectPermissions = require('../../models/Admin/SubjectPermissions');
    const subjectPermissions = await SubjectPermissions.find({
        academicYear: academicYearId,
        teacher: teacherId
    }).select('subjects').lean();

    if (subjectPermissions && subjectPermissions.length > 0) {
        const permissionSubjectIds = subjectPermissions.flatMap(sp => 
            (sp.subjects || []).map(s => s.toString())
        );
        teacherSubjectIds.push(...permissionSubjectIds);
    }

    // Remove duplicates
    const uniqueSubjectIds = [...new Set(teacherSubjectIds)];

    // Build query - show question banks for teacher's subjects
    const query = { status: 'active' };
    
    // Filter by subject if provided
    if (subjectId && subjectId.trim() !== '') {
        // If specific subject is requested, check if teacher has access to it
        if (uniqueSubjectIds.includes(subjectId)) {
            query.subject = subjectId;
        } else {
            // Teacher doesn't have access to this subject
            return res.status(200).json({
                status: 'success',
                results: 0,
                data: []
            });
        }
    } else {
        // Show question banks for all teacher's subjects
        if (uniqueSubjectIds.length > 0) {
            query.subject = { $in: uniqueSubjectIds };
        } else {
            // Teacher has no assigned subjects
            return res.status(200).json({
                status: 'success',
                results: 0,
                data: []
            });
        }
    }

    const questionBanks = await QuestionBank.find(query)
        .populate('createdBy', 'name')
        .populate('subject', 'subjectName')
        .sort({ createdAt: -1 })
        .lean();

    // Calculate the number of questions for each question bank
    const questionBanksWithCounts = await Promise.all(questionBanks.map(async (questionBank) => {
        const questionCount = await Question.countDocuments({ questionBank: questionBank._id });
        return {
            ...questionBank,
            questionCount,
        };
    }));

    res.status(200).json({
        status: 'success',
        results: questionBanksWithCounts.length,
        data: questionBanksWithCounts
    });
});

// Get students for a published exam
exports.getMyTeacherPublishedExamStudents = catchAsync(async (req, res, next) => {
    let teacherId = req.teacherId;
    
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }
    
    if (!teacherId) {
        return next(new AppError('Teacher ID not found in token', 401));
    }

    const publishedExam = await Publish.findById(req.params.publishId)
        .populate('exam', 'examName subjectId')
        .populate({
            path: 'exam',
            populate: {
                path: 'subjectId',
                select: 'subjectName'
            }
        })
        .populate('section', 'sectionName')
        .populate('grade', 'gradeName')
        .lean();

    if (!publishedExam) {
        return next(new AppError('Published exam not found', 404));
    }

    // Get all student attempts for this published exam
    const attempts = await StudentExamAttempt.find({ publishId: req.params.publishId })
        .populate({
            path: 'studentId',
            select: 'studentID studentName email phone',
            populate: {
                path: 'userId',
                select: 'name email'
            }
        })
        .sort({ createdAt: -1 })
        .lean();

    // Format the response
    const students = attempts.map(attempt => ({
        _id: attempt._id,
        studentId: attempt.studentId?._id,
        studentID: attempt.studentId?.studentID,
        studentName: attempt.studentId?.studentName || attempt.studentId?.userId?.name,
        email: attempt.studentId?.email || attempt.studentId?.userId?.email,
        phone: attempt.studentId?.phone,
        attendedStatus: attempt.attendedStatus || false,
        attendedDate: attempt.attendedDate,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        createdAt: attempt.createdAt,
        updatedAt: attempt.updatedAt,
    }));

    // Calculate statistics
    const totalStudents = students.length;
    const attendedStudents = students.filter(s => s.attendedStatus).length;
    const pendingStudents = totalStudents - attendedStudents;

    res.status(200).json({
        status: 'success',
        data: {
            publishedExam: {
                _id: publishedExam._id,
                examName: publishedExam.exam.examName,
                subjectName: publishedExam.exam.subjectId?.subjectName,
                gradeName: publishedExam.grade?.gradeName,
                sectionName: publishedExam.section?.sectionName,
                gender: publishedExam.gender,
                startDate: publishedExam.startDate,
                endDate: publishedExam.endDate,
                numberOfQuestions: publishedExam.numberOfQuestions,
                duration: publishedExam.duration,
                totalUsersSelected: publishedExam.totalUsersSelected,
                attendedUsers: publishedExam.attendedUsers,
            },
            statistics: {
                total: totalStudents,
                attended: attendedStudents,
                pending: pendingStudents,
            },
            students: students,
        }
    });
});