const Student = require('../../models/users/Student');
const AcademicStudent = require('../../models/users/AcademicStudent');
const SectionHistory = require('../../models/users/SectionHistory');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');
const { default: mongoose } = require('mongoose');
const Grade = require('../../models/Admin/Grade');
const Section = require('../../models/Admin/Section');
const Settings = require('../../models/Admin/Settings');
const StudentAssignment = require('../../models/Assignments/StudentAssignment');
const StudentExamAttempt = require('../../models/OnlineExam/StudentExamAttempt');
const StudentPerformance = require('../../models/OnlineExam/StudentPerformance');
const StudentSubject = require('../../models/Admin/StudentSubject');
const { StudentMarks } = require('../../models/MarkEntry/Mark');

// Create a new student
exports.createStudent = catchAsync(async (req, res, next) => {


    //Get Current Academic Year from Settings
    const currentAcademicYear = await Settings.findOne();

    if (!currentAcademicYear) {
        return next(new AppError("No current academic year found in settings", 404));
    }

    req.body.academicYear = currentAcademicYear?.academicYear

    const student = new Student(req.body);
    await student.save();

    // Create an academic record
    const academicData = {
        studentId: student._id,
        academicYear: currentAcademicYear.academicYear,
        grade: req.body.grade,
        gender: req.body.gender,
        section: req.body.section

    };

    await AcademicStudent.create(academicData);

    // Create a Section History
    const sectionData = {
        academicYear: req.body.academicYear,
        section: req.body.section,
        studentId: student._id,
        startDate: req.body.startDate
    };
    await SectionHistory.create(sectionData);

    res.status(201).json(student);
});

//Get Class Students
exports.classStudents = catchAsync(async (req, res) => {
    if (!req?.query?.academicYear) {
        const currentAcademicYear = await Settings.findOne();
        req.query.academicYear = currentAcademicYear?.academicYear
    }
    const students = await AcademicStudent.find(req?.query)
        .populate({
            path: 'studentId',
            populate: {
                path: 'Nationality', // Populate Nationality field from the Student schema
                select: 'name', // Assuming Nationality has a 'name' field
            }
        })
    // Populate Province as State
    res.status(200).json({
        status: 'success',
        results: students.length,
        data: students
    });
});

// Get all students with populated fields
exports.getStudents = catchAsync(async (req, res) => {
    const students = await Student.find()
        .populate('Grade', 'gradeName')
        .populate('academicYear', 'academicYear')
        .populate('Religion', 'religionName')
        .populate('Nationality', 'nationality');

    res.status(200).json(students);
});

// Get a single student by ID with populated fields
exports.getStudentById = catchAsync(async (req, res) => {
    const student = await Student.findById(req.params.id)
        .populate('grade', 'gradeName')
        .populate('academicYear', 'academicYear')
        .populate('Religion', 'religionName')
        .populate('Nationality');

    if (!student) {
        return res.status(404).json({ message: 'Student not found' });
    }

    res.status(200).json(student);
});

// Update a student by ID
exports.updateStudent = catchAsync(async (req, res) => {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) return next(new AppError("Student not found", 404));
    res.status(200).json(student);

});

// Delete a student by ID only if not used in any other models
exports.deleteStudent = catchAsync(async (req, res, next) => {
    const studentId = req.params.id;

    // First, check if the student exists
    const student = await Student.findById(studentId);
    if (!student) {
        return next(new AppError("Student not found", 404));
    }

    // Check if the student is being used in AcademicStudent model
    const academicStudents = await AcademicStudent.find({ studentId: studentId });
    if (academicStudents.length > 0) {
        return next(new AppError(
            `Cannot delete student. This student is being used by ${academicStudents.length} academic student record(s). Please delete the academic records first.`, 
            400
        ));
    }

    // Check if the student is being used in SectionHistory model
    const sectionHistories = await SectionHistory.find({ studentId: studentId });
    if (sectionHistories.length > 0) {
        return next(new AppError(
            `Cannot delete student. This student is being used by ${sectionHistories.length} section history record(s). Please delete the section history records first.`, 
            400
        ));
    }

    // Check if the student is being used in StudentAssignment model
    const studentAssignments = await StudentAssignment.find({ studentId: studentId });
    if (studentAssignments.length > 0) {
        return next(new AppError(
            `Cannot delete student. This student is being used by ${studentAssignments.length} student assignment record(s). Please delete the assignment records first.`, 
            400
        ));
    }

    // Check if the student is being used in StudentExamAttempt model
    const studentExamAttempts = await StudentExamAttempt.find({ studentId: studentId });
    if (studentExamAttempts.length > 0) {
        return next(new AppError(
            `Cannot delete student. This student is being used by ${studentExamAttempts.length} exam attempt record(s). Please delete the exam attempt records first.`, 
            400
        ));
    }

    // Check if the student is being used in StudentPerformance model
    const studentPerformances = await StudentPerformance.find({ studentId: studentId });
    if (studentPerformances.length > 0) {
        return next(new AppError(
            `Cannot delete student. This student is being used by ${studentPerformances.length} performance record(s). Please delete the performance records first.`, 
            400
        ));
    }

    // Check if the student is being used in StudentSubject model
    const studentSubjects = await StudentSubject.find({ studentId: studentId });
    if (studentSubjects.length > 0) {
        return next(new AppError(
            `Cannot delete student. This student is being used by ${studentSubjects.length} subject record(s). Please delete the subject records first.`, 
            400
        ));
    }

    // Check if the student is being used in StudentMarks model
    const studentMarks = await StudentMarks.find({ studentId: studentId });
    if (studentMarks.length > 0) {
        return next(new AppError(
            `Cannot delete student. This student is being used by ${studentMarks.length} mark record(s). Please delete the mark records first.`, 
            400
        ));
    }

    // If no dependencies exist, proceed with deletion
    await Student.findByIdAndDelete(studentId);

    res.status(200).json({ message: 'Student deleted successfully' });
});

const normalizeIdInput = (value) => {
    if (!value && value !== 0) return [];
    if (Array.isArray(value)) {
        return value
            .map((val) => (mongoose.Types.ObjectId.isValid(val) ? new mongoose.Types.ObjectId(val) : null))
            .filter(Boolean);
    }
    if (typeof value === 'string' && value.includes(',')) {
        return value
            .split(',')
            .map((val) => val.trim())
            .filter(Boolean)
            .map((val) => (mongoose.Types.ObjectId.isValid(val) ? new mongoose.Types.ObjectId(val) : null))
            .filter(Boolean);
    }
    if (mongoose.Types.ObjectId.isValid(value)) {
        return [new mongoose.Types.ObjectId(value)];
    }
    return [];
};

const normalizeStringArray = (value) => {
    if (!value && value !== 0) return [];
    if (Array.isArray(value)) {
        return value.map((val) => String(val).toLowerCase()).filter(Boolean);
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((val) => val.trim())
            .filter(Boolean)
            .map((val) => val.toLowerCase());
    }
    return [String(value).toLowerCase()];
};

const ensureAcademicYear = async (academicYear) => {
    if (academicYear) {
        if (mongoose.Types.ObjectId.isValid(academicYear)) {
            return new mongoose.Types.ObjectId(academicYear);
        }
        throw new AppError("Invalid academic year id", 400);
    }

    const currentAcademicYear = await Settings.findOne();

    if (!currentAcademicYear?.academicYear) {
        throw new AppError("No current academic year found in settings", 404);
    }

    return currentAcademicYear.academicYear;
};

// Get All Grades under a specific Academic Year
exports.getGrades = catchAsync(async (req, res, next) => {
    try {
        const academicYearId = await ensureAcademicYear(req.query?.academicYear);
        const statusFilter = req.query?.status || 'active';

        const gradeFilters = {
            academicYear: academicYearId,
        };

        if (statusFilter) {
            gradeFilters.status = statusFilter;
        }

        const uniqueGrades = await AcademicStudent.distinct('grade', gradeFilters);

        const populatedGrades = await Grade.find({ _id: { $in: uniqueGrades } }).select('gradeName name');

        res.status(200).json({
            status: 'success',
            results: populatedGrades.length,
            data: populatedGrades,
        });
    } catch (error) {
        next(error);
    }
});

// Get available genders based on academic year and grade
exports.getGenders = catchAsync(async (req, res, next) => {
    try {
        const academicYearId = await ensureAcademicYear(req.query?.academicYear);
        const gradeIds = normalizeIdInput(req.query?.grade);
        const statusFilter = req.query?.status || 'active';

        const genderFilters = {
            academicYear: academicYearId,
        };

        if (gradeIds.length) {
            genderFilters.grade = { $in: gradeIds };
        }

        if (statusFilter) {
            genderFilters.status = statusFilter;
        }

        const genders = await AcademicStudent.distinct('gender', genderFilters);

        res.status(200).json({
            status: 'success',
            results: genders.length,
            data: genders.map((gender) => String(gender).toLowerCase()),
        });
    } catch (error) {
        next(error);
    }
});

// Get All Sections under specific filters
exports.getSections = catchAsync(async (req, res, next) => {
    try {
        const academicYearId = await ensureAcademicYear(req.query?.academicYear);
        const gradeIds = normalizeIdInput(req.query?.grade);
        const genders = normalizeStringArray(req.query?.gender);
        const statusFilter = req.query?.status || 'active';

        const filters = {
            academicYear: academicYearId,
        };

        if (gradeIds.length) {
            filters.grade = { $in: gradeIds };
        }

        if (genders.length) {
            filters.gender = { $in: genders };
        }

        if (statusFilter) {
            filters.status = statusFilter;
        }

        const uniqueSections = await AcademicStudent.distinct('section', filters);

        const populatedSections = await Section.find({ _id: { $in: uniqueSections } }).select('sectionName name');

        res.status(200).json({
            status: 'success',
            results: populatedSections.length,
            data: populatedSections,
        });
    } catch (error) {
        next(error);
    }
});

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

exports.getStudentDashboardStats = catchAsync(async (req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
        totalStudents,
        newAdmissions,
        activeAcademicRecords,
        inactiveAcademicRecords,
        genderAgg,
        gradeAgg,
        sectionAgg,
        transportAgg,
        recentAdmissionsDocs,
        admissionTimelineAgg,
        assignmentStatusAgg,
        examStatusAgg,
        performanceAgg,
        topPerformersAgg,
    ] = await Promise.all([
        Student.countDocuments(),
        Student.countDocuments({ createdAt: { $gte: startOfMonth } }),
        AcademicStudent.countDocuments({ status: 'active' }),
        AcademicStudent.countDocuments({ status: { $ne: 'active' } }),
        Student.aggregate([
            {
                $group: {
                    _id: { $toLower: { $ifNull: ['$gender', 'unknown'] } },
                    count: { $sum: 1 },
                },
            },
        ]),
        Student.aggregate([
            { $group: { _id: '$grade', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
        Student.aggregate([
            { $group: { _id: '$section', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
        Student.aggregate([
            {
                $group: {
                    _id: { $ifNull: ['$Transport_Pickup', 'Not Specified'] },
                    count: { $sum: 1 },
                },
            },
        ]),
        Student.find({})
            .sort({ createdAt: -1 })
            .limit(6)
            .select('studentName studentID grade section createdAt Admission_date gender')
            .populate('grade', 'gradeName')
            .populate('section', 'sectionName')
            .lean(),
        Student.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]),
        StudentAssignment.aggregate([
            {
                $group: {
                    _id: { $ifNull: ['$attendedStatus', false] },
                    count: { $sum: 1 },
                },
            },
        ]),
        StudentExamAttempt.aggregate([
            {
                $group: {
                    _id: { $ifNull: ['$attendedStatus', false] },
                    count: { $sum: 1 },
                },
            },
        ]),
        StudentMarks.aggregate([
            {
                $match: {
                    studentMark: { $ne: null },
                    mark: { $gt: 0 },
                },
            },
            {
                $group: {
                    _id: '$grade',
                    averagePercentage: {
                        $avg: {
                            $multiply: [
                                { $divide: ['$studentMark', '$mark'] },
                                100,
                            ],
                        },
                    },
                    examCount: { $sum: 1 },
                },
            },
            { $sort: { averagePercentage: -1 } },
        ]),
        StudentMarks.aggregate([
            {
                $match: {
                    studentMark: { $ne: null },
                    mark: { $gt: 0 },
                },
            },
            {
                $group: {
                    _id: '$studentId',
                    averagePercentage: {
                        $avg: {
                            $multiply: [
                                { $divide: ['$studentMark', '$mark'] },
                                100,
                            ],
                        },
                    },
                    examsTaken: { $sum: 1 },
                },
            },
            { $sort: { averagePercentage: -1 } },
            { $limit: 5 },
        ]),
    ]);

    const genderDistribution = genderAgg.reduce(
        (acc, item) => ({ ...acc, [item._id || 'unknown']: item.count }),
        { male: 0, female: 0, other: 0, unknown: 0 }
    );

    const gradeIds = gradeAgg.map((item) => item._id).filter(Boolean);
    const performanceGradeIds = performanceAgg.map((item) => item._id).filter(Boolean);
    const sectionIds = sectionAgg.map((item) => item._id).filter(Boolean);
    const topPerformerStudentIds = topPerformersAgg.map((item) => item._id).filter(Boolean);

    const [gradesMap, sectionsMap, topPerformerStudents] = await Promise.all([
        gradeIds.length || performanceGradeIds.length
            ? Grade.find({ _id: { $in: [...new Set([...gradeIds, ...performanceGradeIds])] } })
                  .select('gradeName')
                  .lean()
                  .then((docs) => docs.reduce((acc, doc) => ({ ...acc, [doc._id.toString()]: doc.gradeName }), {}))
            : Promise.resolve({}),
        sectionIds.length
            ? Section.find({ _id: { $in: sectionIds } })
                  .select('sectionName')
                  .lean()
                  .then((docs) => docs.reduce((acc, doc) => ({ ...acc, [doc._id.toString()]: doc.sectionName }), {}))
            : Promise.resolve({}),
        topPerformerStudentIds.length
            ? Student.find({ _id: { $in: topPerformerStudentIds } })
                  .select('studentName studentID grade section')
                  .populate('grade', 'gradeName')
                  .populate('section', 'sectionName')
                  .lean()
            : Promise.resolve([]),
    ]);

    const gradeDistribution = gradeAgg.map((item) => ({
        gradeId: item._id,
        gradeName: gradesMap[item._id?.toString()] || 'Unassigned',
        count: item.count,
    }));

    const sectionDistribution = sectionAgg.map((item) => ({
        sectionId: item._id,
        sectionName: sectionsMap[item._id?.toString()] || 'Unassigned',
        count: item.count,
    }));

    const transportUsage = transportAgg.map((item) => ({
        label: item._id || 'Not Specified',
        count: item.count,
    }));

    const admissionTimeline = admissionTimelineAgg
        .slice(Math.max(admissionTimelineAgg.length - 12, 0))
        .map((item) => ({
            month: formatMonthLabel(item._id),
            value: item.count,
            raw: item._id,
        }));

    const assignmentsCompleted = assignmentStatusAgg.find((item) => item._id === true)?.count || 0;
    const assignmentsPending = assignmentStatusAgg.find((item) => item._id === false)?.count || 0;
    const assignmentStats = {
        total: assignmentsCompleted + assignmentsPending,
        completed: assignmentsCompleted,
        pending: assignmentsPending,
    };

    const examsCompleted = examStatusAgg.find((item) => item._id === true)?.count || 0;
    const examsPending = examStatusAgg.find((item) => item._id === false)?.count || 0;
    const examStats = {
        total: examsCompleted + examsPending,
        completed: examsCompleted,
        pending: examsPending,
    };

    const performanceByGrade = performanceAgg.map((item) => ({
        gradeId: item._id,
        gradeName: gradesMap[item._id?.toString()] || 'Unassigned',
        averagePercentage: Number(Number.parseFloat(item.averagePercentage || 0).toFixed(1)),
        examCount: item.examCount,
    }));

    const topPerformerMap = topPerformerStudents.reduce((acc, student) => {
        acc[student._id.toString()] = student;
        return acc;
    }, {});

    const topPerformers = topPerformersAgg.map((item) => {
        const student = topPerformerMap[item._id?.toString()] || {};
        return {
            studentId: item._id,
            studentName: student.studentName || 'Unknown Student',
            studentCode: student.studentID || 'N/A',
            gradeName: student.grade?.gradeName || 'Unassigned',
            sectionName: student.section?.sectionName || 'Unassigned',
            averagePercentage: Number(Number.parseFloat(item.averagePercentage || 0).toFixed(1)),
            examsTaken: item.examsTaken,
        };
    });

    const recentAdmissions = recentAdmissionsDocs.map((doc) => ({
        studentId: doc._id,
        studentName: doc.studentName,
        studentCode: doc.studentID,
        gradeName: doc.grade?.gradeName || 'Unassigned',
        sectionName: doc.section?.sectionName || 'Unassigned',
        admissionDate: doc.Admission_date || doc.createdAt,
        gender: doc.gender || 'unknown',
    }));

    const summary = {
        totalStudents,
        activeEnrollments: activeAcademicRecords,
        inactiveEnrollments: inactiveAcademicRecords,
        newAdmissions,
        assignmentsCompleted: assignmentStats.completed,
        examsCompleted: examStats.completed,
    };

    res.status(200).json({
        status: 'success',
        data: {
            summary,
            genderDistribution,
            gradeDistribution,
            sectionDistribution,
            transportUsage,
            admissionTimeline,
            assignmentStats,
            examStats,
            performanceByGrade,
            topPerformers,
            recentAdmissions,
        },
    });
});

//Verify Student exists based on StudentId, dob and Phone Number
exports.verifyStudent = catchAsync(async (req, res, next) => {
    try {
        const { studentId, dob, phoneNumber } = req.body;

        const student = await Student.findOne({ studentID: studentId, Dob: dob, contactNo: phoneNumber }).select("studentID  studentName grade gender section userId").populate("grade").populate("section");

        if (!student) {
            return next(new AppError("No Matching students are found. Please verify your details!", 404));
        }

        if(student?.userId){
            return next(new AppError("This student is already registered with an existing account!", 409));
        }

        // Verify if the student has academic record
        const academicRecord = await AcademicStudent.findOne({ studentId: student?._id });

        if (!academicRecord) {
            return next(new AppError("Academic record not found for this student!", 404));
        }


        // Verify if the student has a grade

        res.status(200).json({ message: 'Student exists', data: student });
    } catch (error) {
        return next(error);
    }

});
