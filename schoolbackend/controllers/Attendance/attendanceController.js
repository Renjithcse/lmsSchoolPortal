const mongoose = require('mongoose');
const Attendance = require('../../models/Attendance/Attendance');
const Student = require('../../models/users/Student');
const Teacher = require('../../models/users/Teacher');
const AcademicYear = require('../../models/Admin/AcademicYear');
const AcademicStudent = require('../../models/users/AcademicStudent');
const TermHistory = require('../../models/Admin/TermHistory');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const Settings = require('../../models/Admin/Settings');

// Mark attendance (for biometric, RFID, mobile, web)
exports.markAttendance = catchAsync(async (req, res) => {
    const {
        studentId,
        teacherId,
        attendanceType,
        attendanceMethod,
        status,
        location,
        deviceInfo,
        notes
    } = req.body;

    // Validate required fields
    if (!attendanceType || !attendanceMethod) {
        return res.status(400).json({
            message: 'Attendance type and method are required'
        });
    }

    // Get current academic year
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }

    const academicYear = currentSettings.academicYear._id;

    let attendanceData = {
        attendanceType,
        attendanceMethod,
        status: status || 'present',
        academicYear: academicYear,
        timeIn: new Date(),
        deviceInfo: {
            deviceId: deviceInfo?.deviceId || req.headers['device-id'],
            deviceType: attendanceMethod,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        },
        notes
    };

    // Add location for mobile attendance
    if (location && attendanceMethod === 'mobile') {
        attendanceData.location = location;
    }

    // Handle student attendance
    if (attendanceType === 'student') {
        if (!studentId) {
            return res.status(400).json({
                message: 'Student ID is required for student attendance'
            });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                message: 'Student not found'
            });
        }

        attendanceData.student = studentId;
        attendanceData.grade = student.grade;
    }

    // Handle teacher attendance
    if (attendanceType === 'teacher') {
        if (!teacherId) {
            return res.status(400).json({
                message: 'Teacher ID is required for teacher attendance'
            });
        }

        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({
                message: 'Teacher not found'
            });
        }

        attendanceData.teacher = teacherId;
    }

    // Check if attendance already exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
        date: { $gte: today, $lt: tomorrow },
        attendanceType,
        isActive: true,
        ...(attendanceType === 'student' ? { student: studentId } : { teacher: teacherId })
    });

    if (existingAttendance) {
        // Update existing attendance (e.g., for time out)
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
    const attendance = new Attendance(attendanceData);
    await attendance.save();

    res.status(201).json({
        status: 'success',
        message: 'Attendance marked successfully',
        data: attendance
    });
});

// Get attendance by date range
exports.getAttendanceByDateRange = catchAsync(async (req, res) => {
    const { fromDate, toDate, academicYear, grade, gender, section } = req.query;

    if (!fromDate || !toDate) {
        return res.status(400).json({
            status: 'error',
            message: 'From date and to date are required'
        });
    }

    try {
        // Parse the dates
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);

        // Base query for the date range
        const baseQuery = {
            date: {
                $gte: startDate,
                $lte: endDate
            },
            isActive: true,
            attendanceType: 'student'
        };

        // Add academic year filter if provided
        if (academicYear) {
            try {
                baseQuery.academicYear = mongoose.Types.ObjectId(academicYear);
            } catch (error) {
                baseQuery.academicYear = academicYear;
            }
        }

        // Add grade filter if provided
        if (grade) {
            try {
                baseQuery.grade = mongoose.Types.ObjectId(grade);
            } catch (error) {
                baseQuery.grade = grade;
            }
        }

        // Get attendance data for the date range using basic find with populate
        const attendance = await Attendance.find(baseQuery)
            .populate('student', 'studentName studentID')
            .populate('grade', 'gradeName')
            .populate('academicYear', 'academicYear')
            .lean();

        // If gender or section filters are provided for student attendance, filter through AcademicStudent
        let filteredAttendance = attendance;
        
        if (gender || section) {
            // Get unique student IDs from attendance records
            const studentIds = [...new Set(
                attendance
                    .filter(record => record.student && record.student._id)
                    .map(record => record.student._id.toString())
            )];

            if (studentIds.length > 0) {
                // Build AcademicStudent query
                const academicStudentQuery = {
                    studentId: { $in: studentIds }
                };

                // Add grade filter if provided (to match with attendance grade)
                if (grade) {
                    const gradeFilters = [];
                    try {
                        gradeFilters.push(mongoose.Types.ObjectId(grade));
                    } catch (error) {
                        // ignore
                    }
                    gradeFilters.push(grade);
                    academicStudentQuery.grade = { $in: gradeFilters };
                }

                // Add gender filter if provided
                if (gender) {
                    academicStudentQuery.gender = { $regex: new RegExp(`^${gender}$`, 'i') };
                }

                // Add section filter if provided
                if (section) {
                    try {
                        academicStudentQuery.section = mongoose.Types.ObjectId(section);
                    } catch (error) {
                        academicStudentQuery.section = section;
                    }
                }

                // Get matching AcademicStudent records
                const academicStudents = await AcademicStudent.find(academicStudentQuery)
                    .populate('section', 'sectionName')
                    .lean();

                // Create a set of student IDs that match the filters
                const matchingStudentIds = new Set(
                    academicStudents.map(as => as.studentId.toString())
                );

                // Filter attendance records to only include students that match
                filteredAttendance = attendance.filter(record => {
                    if (record.student && record.student._id) {
                        return matchingStudentIds.has(record.student._id.toString());
                    }
                    return false; // Exclude records without student
                });
            } else {
                // No students found, return empty array
                filteredAttendance = [];
            }
        }

        // Now combine with AcademicStudent data for additional context
        const enrichedAttendanceData = await Promise.all(
            filteredAttendance.map(async (attendanceRecord) => {
                // Find matching AcademicStudent record with section populated
                const academicStudentQuery = {
                    studentId: attendanceRecord.student._id,
                    academicYear: attendanceRecord.academicYear._id,
                    grade: attendanceRecord.grade._id
                };

                // Add gender filter if provided
                if (gender) {
                    academicStudentQuery.gender = { $regex: new RegExp(`^${gender}$`, 'i') };
                }

                // Add section filter if provided
                if (section) {
                    try {
                        academicStudentQuery.section = mongoose.Types.ObjectId(section);
                    } catch (error) {
                        academicStudentQuery.section = section;
                    }
                }

                const academicStudent = await AcademicStudent.findOne(academicStudentQuery)
                    .populate('section', 'sectionName')
                    .lean();

                // Use helper function to format data consistently
                return formatAttendanceData(attendanceRecord, academicStudent);
            })
        );

        res.status(200).json({
            status: 'success',
            message: 'Attendance data retrieved successfully',
            data: enrichedAttendanceData
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error retrieving attendance data',
            error: error.message
        });
    }
});

// Get attendance by date
exports.getAttendanceByDate = catchAsync(async (req, res) => {
    const { date, attendanceType, grade, gender, section } = req.query;

    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(queryDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const query = {
        date: { $gte: queryDate, $lt: nextDate },
        isActive: true
    };

    if (attendanceType) {
        query.attendanceType = attendanceType;
    }

    if (grade) {
        try {
            query.grade = mongoose.Types.ObjectId(grade);
        } catch (error) {
            query.grade = grade;
        }
    }

    const attendance = await Attendance.find(query)
        .populate('student', 'studentName studentID')
        .populate('teacher', 'name employeeId')
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .sort({ timeIn: 1 });

    // If gender or section filters are provided for student attendance, filter through AcademicStudent
    let filteredAttendance = attendance;
    
    if (attendanceType === 'student' && (gender || section)) {
        // Get unique student IDs from attendance records
        const studentIds = [...new Set(
            attendance
                .filter(record => record.student && record.student._id)
                .map(record => record.student._id.toString())
        )];

        if (studentIds.length > 0) {
            // Build AcademicStudent query
            const academicStudentQuery = {
                studentId: { $in: studentIds }
            };

            // Add grade filter if provided (to match with attendance grade)
            if (grade) {
                const gradeFilters = [];
                try {
                    gradeFilters.push(mongoose.Types.ObjectId(grade));
                } catch (error) {
                    // ignore
                }
                gradeFilters.push(grade);
                academicStudentQuery.grade = { $in: gradeFilters };
            }

            // Add gender filter if provided
            if (gender) {
                academicStudentQuery.gender = { $regex: new RegExp(`^${gender}$`, 'i') };
            }

            // Add section filter if provided
            if (section) {
                try {
                    academicStudentQuery.section = mongoose.Types.ObjectId(section);
                } catch (error) {
                    academicStudentQuery.section = section;
                }
            }

            // Get matching AcademicStudent records
            const academicStudents = await AcademicStudent.find(academicStudentQuery)
                .populate('section', 'sectionName')
                .lean();

            // Create a set of student IDs that match the filters
            const matchingStudentIds = new Set(
                academicStudents.map(as => as.studentId.toString())
            );

            // Filter attendance records to only include students that match
            filteredAttendance = attendance.filter(record => {
                if (record.attendanceType === 'student' && record.student && record.student._id) {
                    return matchingStudentIds.has(record.student._id.toString());
                }
                return true; // Keep non-student records
            });
        } else {
            // No students found, return empty array
            filteredAttendance = [];
        }
    }

    // Enrich with AcademicStudent data for student attendance records
    const enrichedAttendance = await Promise.all(
        filteredAttendance.map(async (record) => {
            if (record.attendanceType === 'student' && record.student && record.academicYear && record.grade) {
                const academicStudentQuery = {
                    studentId: record.student._id,
                    academicYear: record.academicYear._id,
                    grade: record.grade._id
                };

                // Add gender filter if provided
                if (gender) {
                    academicStudentQuery.gender = { $regex: new RegExp(`^${gender}$`, 'i') };
                }

                // Add section filter if provided
                if (section) {
                    try {
                        academicStudentQuery.section = mongoose.Types.ObjectId(section);
                    } catch (error) {
                        academicStudentQuery.section = section;
                    }
                }

                const academicStudent = await AcademicStudent.findOne(academicStudentQuery)
                    .populate('section', 'sectionName')
                    .lean();

                // Use helper function to format data consistently
                return formatAttendanceData(record, academicStudent);
            }
            return record.toObject();
        })
    );

    res.status(200).json({
        status: 'success',
        data: enrichedAttendance
    });
});

// Get attendance statistics
exports.getAttendanceStats = catchAsync(async (req, res) => {
    const { startDate, endDate, attendanceType, grade } = req.query;

    const filters = {};
    if (attendanceType) filters.attendanceType = attendanceType;
    if (grade) filters.grade = grade;

    const stats = await Attendance.getAttendanceStats(filters);

    res.status(200).json({
        status: 'success',
        data: stats
    });
});



// Get student attendance
exports.getStudentAttendance = catchAsync(async (req, res) => {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({
            message: 'Start date and end date are required'
        });
    }

    const attendance = await Attendance.getAttendanceByDateRange(startDate, endDate, {
        student: studentId,
        attendanceType: 'student'
    });

    res.status(200).json({
        status: 'success',
        data: attendance
    });
});

// Get teacher attendance
exports.getTeacherAttendance = catchAsync(async (req, res) => {
    const { teacherId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({
            message: 'Start date and end date are required'
        });
    }

    const attendance = await Attendance.getAttendanceByDateRange(startDate, endDate, {
        teacher: teacherId,
        attendanceType: 'teacher'
    });

    res.status(200).json({
        status: 'success',
        data: attendance
    });
});

// Update attendance (for manual corrections)
exports.updateAttendance = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status, timeIn, timeOut, notes, remarks } = req.body;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
        return res.status(404).json({
            message: 'Attendance record not found'
        });
    }

    // Update fields
    if (status) attendance.status = status;
    if (timeIn) attendance.timeIn = timeIn;
    if (timeOut) attendance.timeOut = timeOut;
    if (notes) attendance.notes = notes;
    if (remarks) attendance.remarks = remarks;

    // Mark as verified
    attendance.verifiedBy = req.user.id;
    attendance.verifiedAt = new Date();

    await attendance.save();

    res.status(200).json({
        status: 'success',
        message: 'Attendance updated successfully',
        data: attendance
    });
});

// Delete attendance
exports.deleteAttendance = catchAsync(async (req, res) => {
    const { id } = req.params;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
        return res.status(404).json({
            message: 'Attendance record not found'
        });
    }

    attendance.isActive = false;
    await attendance.save();

    res.status(200).json({
        status: 'success',
        message: 'Attendance deleted successfully'
    });
});

// Bulk mark attendance (for web attendance)
exports.bulkMarkAttendance = catchAsync(async (req, res) => {
    const { attendanceData, date, grade } = req.body;

    if (!attendanceData || !Array.isArray(attendanceData)) {
        return res.status(400).json({
            message: 'Attendance data array is required'
        });
    }

    // Get current academic year
    // Get current academic year
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }

    const academicYear = currentSettings.academicYear._id;

    const attendanceRecords = [];
    const errors = [];

    for (const record of attendanceData) {
        try {
            const attendanceData = {
                date: date ? new Date(date) : new Date(),
                attendanceType: record.attendanceType,
                attendanceMethod: 'web',
                status: record.status || 'present',
                academicYear: academicYear,
                timeIn: new Date(),
                deviceInfo: {
                    deviceId: 'web-system',
                    deviceType: 'web',
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                },
                notes: record.notes
            };

            if (record.attendanceType === 'student') {
                attendanceData.student = record.studentId;
                attendanceData.grade = grade;
            } else {
                attendanceData.teacher = record.teacherId;
            }

            const attendance = new Attendance(attendanceData);
            await attendance.save();
            attendanceRecords.push(attendance);
        } catch (error) {
            errors.push({
                record,
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

// Get attendance dashboard data
exports.getAttendanceDashboard = catchAsync(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's attendance stats
    const todayStats = await Attendance.aggregate([
        {
            $match: {
                date: { $gte: today, $lt: tomorrow },
                isActive: true
            }
        },
        {
            $group: {
                _id: {
                    attendanceType: '$attendanceType',
                    status: '$status'
                },
                count: { $sum: 1 }
            }
        }
    ]);

    // This month's attendance stats
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthStats = await Attendance.aggregate([
        {
            $match: {
                date: { $gte: startOfMonth, $lte: endOfMonth },
                isActive: true
            }
        },
        {
            $group: {
                _id: {
                    date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    attendanceType: '$attendanceType',
                    status: '$status'
                },
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: "$_id.date",
                types: {
                    $push: {
                        attendanceType: "$_id.attendanceType",
                        status: "$_id.status",
                        count: "$count"
                    }
                }
            }
        },
        { $sort: { _id: -1 } }
    ]);

    // Recent attendance
    const recentAttendance = await Attendance.find({
        isActive: true
    })
    .populate('student', 'name rollNumber')
    .populate('teacher', 'name employeeId')
    .populate('grade', 'grade')
    .sort({ createdAt: -1 })
    .limit(10);

    res.status(200).json({
        status: 'success',
        data: {
            todayStats,
            monthStats,
            recentAttendance
        }
    });
});

// Get registered active students for attendance
exports.getRegisteredActiveStudents = catchAsync(async (req, res) => {
    const { academicYear, grade, gender, section } = req.query;

    // Get current academic year from Settings if not provided
    let currentAcademicYear = academicYear;
    if (!currentAcademicYear) {
        const currentSettings = await Settings.findOne().populate('academicYear');
        if (!currentSettings) {
            return res.status(400).json({
                status: 'error',
                message: 'System settings not configured. Please set up academic year in settings.'
            });
        }
        currentAcademicYear = currentSettings.academicYear._id;
    }

    // Validate required parameters
    if (!grade || !gender || !section) {
        return res.status(400).json({
            status: 'error',
            message: 'Grade, gender, and section are required'
        });
    }

    try {
        const students = await AcademicStudent.find({
            academicYear: currentAcademicYear,
            grade,
            gender,
            section,
            status: 'active'
        })
        .populate('studentId', 'studentName studentID image phoneNumber _id')
        .select('studentId _id')
        .sort({ 'studentId.studentName': 1 });

        // Transform the data to return the required format
        const formattedStudents = students.map(student => ({
            _id: student.studentId._id,
            studentName: student.studentId.studentName,
            studentID: student.studentId.studentID,
            image: student.studentId.image,
            phoneNumber: student.studentId.phoneNumber
        }));

        res.status(200).json({
            status: 'success',
            message: 'Active students retrieved successfully',
            data: formattedStudents,
            count: formattedStudents.length
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error retrieving active students',
            error: error.message
        });
    }
});

// Get attendance summary report
exports.getAttendanceSummaryReport = catchAsync(async (req, res) => {
    const { reportDate, summaryType, academicYear, grade, gender, section } = req.query;

    if (!reportDate) {
        return res.status(400).json({
            status: 'error',
            message: 'Report date is required'
        });
    }

    try {
        // Parse the date
        const targetDate = new Date(reportDate);
        targetDate.setHours(0, 0, 0, 0);
        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);

        // Base query for the specific date
        const baseQuery = {
            date: {
                $gte: targetDate,
                $lt: nextDate
            },
            isActive: true,
            attendanceType: 'student'
        };

        // Add academic year filter if provided - convert to ObjectId
        if (academicYear) {
            try {
                baseQuery.academicYear = mongoose.Types.ObjectId(academicYear);
                console.log('Converted academicYear to ObjectId:', baseQuery.academicYear);
            } catch (error) {
                console.log('Could not convert academicYear to ObjectId, using as string');
                baseQuery.academicYear = academicYear;
            }
        }

        // Debug: Check if grade is ObjectId or string
        console.log('Grade parameter:', grade);
        console.log('Grade type:', typeof grade);
        
        // Try to convert grade to ObjectId if it's a string
        if (grade && typeof grade === 'string') {
            try {
                baseQuery.grade = mongoose.Types.ObjectId(grade);
                console.log('Converted grade to ObjectId:', baseQuery.grade);
            } catch (error) {
                console.log('Could not convert grade to ObjectId, using as string');
                baseQuery.grade = grade;
            }
        }

        // Get total students for the date
        const totalStudents = await Attendance.aggregate([
            { $match: baseQuery },
            {
                $group: {
                    _id: null,
                    totalStudents: { $sum: 1 },
                    presentStudents: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
                        }
                    },
                    absentStudents: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
                        }
                    },
                    lateStudents: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        let reportData = {
            title: 'Attendance Summary Report',
            date: reportDate,
            totalStudents: 0,
            presentStudents: 0,
            absentStudents: 0,
            lateStudents: 0,
            attendancePercentage: 0
        };

        if (totalStudents.length > 0) {
            const stats = totalStudents[0];
            reportData = {
                ...reportData,
                totalStudents: stats.totalStudents,
                presentStudents: stats.presentStudents,
                absentStudents: stats.absentStudents,
                lateStudents: stats.lateStudents,
                attendancePercentage: Math.round((stats.presentStudents / stats.totalStudents) * 100)
            };
        }

        // Generate specific report based on summary type
        if (summaryType === 'all-classes') {
            // Get grade-wise breakdown
            const gradeData = await Attendance.aggregate([
                { $match: baseQuery },
                {
                    $lookup: {
                        from: 'grades',
                        localField: 'grade',
                        foreignField: '_id',
                        as: 'gradeInfo'
                    }
                },
                {
                    $unwind: '$gradeInfo'
                },
                {
                    $group: {
                        _id: '$grade',
                        grade: { $first: '$gradeInfo.gradeName' },
                        total: { $sum: 1 },
                        present: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
                            }
                        },
                        absent: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
                            }
                        },
                        percentage: {
                            $avg: {
                                $cond: [{ $eq: ['$status', 'present'] }, 100, 0]
                            }
                        }
                    }
                },
                { $sort: { grade: 1 } }
            ]);

            reportData.gradeData = gradeData.map(item => ({
                grade: item.grade,
                total: item.total,
                present: item.present,
                absent: item.absent,
                percentage: Math.round(item.percentage)
            }));

            // Get gender-wise breakdown
            const genderData = await Attendance.aggregate([
                { $match: baseQuery },
                {
                    $lookup: {
                        from: 'academicstudents',
                        localField: 'student',
                        foreignField: 'studentId',
                        as: 'academicStudent'
                    }
                },
                {
                    $unwind: '$academicStudent'
                },
                {
                    $group: {
                        _id: '$academicStudent.gender',
                        gender: { $first: '$academicStudent.gender' },
                        total: { $sum: 1 },
                        present: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
                            }
                        },
                        absent: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
                            }
                        },
                        percentage: {
                            $avg: {
                                $cond: [{ $eq: ['$status', 'present'] }, 100, 0]
                            }
                        }
                    }
                }
            ]);

            reportData.genderData = genderData.map(item => ({
                gender: item.gender,
                total: item.total,
                present: item.present,
                absent: item.absent,
                percentage: Math.round(item.percentage)
            }));

        } else if (summaryType === 'grade-wise') {
            // Get detailed grade-wise data
            const gradeData = await Attendance.aggregate([
                { $match: baseQuery },
                {
                    $lookup: {
                        from: 'grades',
                        localField: 'grade',
                        foreignField: '_id',
                        as: 'gradeInfo'
                    }
                },
                {
                    $unwind: '$gradeInfo'
                },
                {
                    $group: {
                        _id: '$grade',
                        grade: { $first: '$gradeInfo.gradeName' },
                        total: { $sum: 1 },
                        present: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
                            }
                        },
                        absent: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
                            }
                        },
                        percentage: {
                            $avg: {
                                $cond: [{ $eq: ['$status', 'present'] }, 100, 0]
                            }
                        }
                    }
                },
                { $sort: { grade: 1 } }
            ]);

            reportData.gradeData = gradeData.map(item => ({
                grade: item.grade,
                total: item.total,
                present: item.present,
                absent: item.absent,
                percentage: Math.round(item.percentage)
            }));

        } else if (summaryType === 'gender-wise') {
            // Get detailed gender-wise data
            const genderData = await Attendance.aggregate([
                { $match: baseQuery },
                {
                    $lookup: {
                        from: 'academicstudents',
                        localField: 'student',
                        foreignField: 'studentId',
                        as: 'academicStudent'
                    }
                },
                {
                    $unwind: '$academicStudent'
                },
                {
                    $group: {
                        _id: '$academicStudent.gender',
                        gender: { $first: '$academicStudent.gender' },
                        total: { $sum: 1 },
                        present: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
                            }
                        },
                        absent: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
                            }
                        },
                        percentage: {
                            $avg: {
                                $cond: [{ $eq: ['$status', 'present'] }, 100, 0]
                            }
                        }
                    }
                }
            ]);

            reportData.genderData = genderData.map(item => ({
                gender: item.gender,
                total: item.total,
                present: item.present,
                absent: item.absent,
                percentage: Math.round(item.percentage)
            }));
        }

        res.status(200).json({
            status: 'success',
            message: 'Attendance summary report generated successfully',
            data: reportData
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error generating attendance summary report',
            error: error.message
        });
    }
});

// Get classwise attendance report
exports.getClasswiseAttendanceReport = catchAsync(async (req, res) => {
    const { fromDate, toDate, academicYear, grade, gender, section } = req.query;

    if (!fromDate || !toDate || !academicYear || !grade) {
        return res.status(400).json({
            status: 'error',
            message: 'From date, to date, academic year, and grade are required'
        });
    }

    try {
        // Parse dates
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);

        // First, get all registered students from AcademicStudent
        const academicStudents = await AcademicStudent.find({
            academicYear: academicYear,
            grade: grade,
            section: section,
            gender: gender,
            status: 'active'
        }).populate('studentId', 'studentName studentID rollNumber')
          .populate('grade', 'gradeName')
          .populate('section', 'sectionName')
          .sort({ 'studentId.studentName': 1 });

        if (!academicStudents || academicStudents.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No students found for the specified criteria'
            });
        }

        // Get attendance records for the date range
        const attendanceRecords = await Attendance.find({
            date: { $gte: startDate, $lte: endDate },
            isActive: true,
            attendanceType: 'student',
            academicYear: academicYear,
            grade: grade
        }).populate('student', 'studentName studentID rollNumber')
          .populate('grade', 'gradeName')
          .sort({ date: 1, 'student.studentName': 1 });

        // Create a map of attendance records by student ID for quick lookup
        const attendanceMap = new Map();
        attendanceRecords.forEach(record => {
            const studentId = record.student._id.toString();
            if (!attendanceMap.has(studentId)) {
                attendanceMap.set(studentId, []);
            }
            attendanceMap.get(studentId).push(record);
        });

        // Process each academic student and their attendance
        const students = academicStudents.map(academicStudent => {
            const studentId = academicStudent.studentId._id.toString();
            const studentAttendanceRecords = attendanceMap.get(studentId) || [];
            
            // Initialize student data
            const studentData = {
                studentName: academicStudent.studentId.studentName,
                studentID: academicStudent.studentId.studentID,
                rollNumber: academicStudent.studentId.rollNumber,
                totalDays: 0,
                presentDays: 0,
                absentDays: 0,
                lateDays: 0,
                attendanceRecords: []
            };

            // Process attendance records for this student
            studentAttendanceRecords.forEach(record => {
                studentData.totalDays++;
                studentData.attendanceRecords.push({
                    date: record.date.toISOString().split('T')[0],
                    status: record.status,
                    timeIn: record.timeIn,
                    attendanceMethod: record.attendanceMethod
                });

                switch (record.status) {
                    case 'present':
                        studentData.presentDays++;
                        break;
                    case 'absent':
                        studentData.absentDays++;
                        break;
                    case 'late':
                        studentData.lateDays++;
                        break;
                }
            });

            // Calculate attendance percentage
            studentData.attendancePercentage = studentData.totalDays > 0 ? 
                Math.round((studentData.presentDays / studentData.totalDays) * 100) : 0;

            return studentData;
        });

        // Calculate summary statistics
        const totalStudents = students.length;
        const totalPresentDays = students.reduce((sum, student) => sum + student.presentDays, 0);
        const totalAbsentDays = students.reduce((sum, student) => sum + student.absentDays, 0);
        const totalLateDays = students.reduce((sum, student) => sum + student.lateDays, 0);
        const totalDays = students.reduce((sum, student) => sum + student.totalDays, 0);
        const overallAttendancePercentage = totalDays > 0 ? 
            Math.round((totalPresentDays / totalDays) * 100) : 0;

        // Get grade and section information from academic students
        const gradeName = academicStudents[0]?.grade?.gradeName || grade;
        const sectionName = academicStudents[0]?.section?.sectionName || section || 'All';

        // Generate visual representation data
        const visualData = {
            // Pie chart data for overall attendance distribution
            attendanceDistribution: [
                { label: 'Present', value: totalPresentDays, color: '#10B981', percentage: totalDays > 0 ? Math.round((totalPresentDays / totalDays) * 100) : 0 },
                { label: 'Absent', value: totalAbsentDays, color: '#EF4444', percentage: totalDays > 0 ? Math.round((totalAbsentDays / totalDays) * 100) : 0 },
                { label: 'Late', value: totalLateDays, color: '#F59E0B', percentage: totalDays > 0 ? Math.round((totalLateDays / totalDays) * 100) : 0 }
            ],

            // Bar chart data for student-wise attendance percentage
            studentAttendanceChart: students.map(student => ({
                name: student.studentName,
                percentage: student.attendancePercentage,
                presentDays: student.presentDays,
                totalDays: student.totalDays,
                color: student.attendancePercentage >= 90 ? '#10B981' : 
                       student.attendancePercentage >= 75 ? '#F59E0B' : '#EF4444'
            })),

            // Attendance trend by date (if we have multiple dates)
            attendanceTrend: (() => {
                const dateMap = new Map();
                students.forEach(student => {
                    student.attendanceRecords.forEach(record => {
                        if (!dateMap.has(record.date)) {
                            dateMap.set(record.date, { present: 0, absent: 0, late: 0, total: 0 });
                        }
                        const dateData = dateMap.get(record.date);
                        dateData.total++;
                        switch (record.status) {
                            case 'present': dateData.present++; break;
                            case 'absent': dateData.absent++; break;
                            case 'late': dateData.late++; break;
                        }
                    });
                });

                return Array.from(dateMap.entries()).map(([date, data]) => ({
                    date,
                    present: data.present,
                    absent: data.absent,
                    late: data.late,
                    total: data.total,
                    percentage: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
                })).sort((a, b) => new Date(a.date) - new Date(b.date));
            })(),

            // Performance indicators
            performanceIndicators: {
                excellent: students.filter(s => s.attendancePercentage >= 90).length,
                good: students.filter(s => s.attendancePercentage >= 75 && s.attendancePercentage < 90).length,
                needsImprovement: students.filter(s => s.attendancePercentage < 75).length,
                noAttendance: students.filter(s => s.totalDays === 0).length
            },

            // Attendance statistics for cards/widgets
            statistics: {
                averageAttendance: totalStudents > 0 ? Math.round(students.reduce((sum, s) => sum + s.attendancePercentage, 0) / totalStudents) : 0,
                highestAttendance: students.length > 0 ? Math.max(...students.map(s => s.attendancePercentage)) : 0,
                lowestAttendance: students.length > 0 ? Math.min(...students.map(s => s.attendancePercentage)) : 0,
                totalAttendanceDays: totalDays,
                averageDaysPerStudent: totalStudents > 0 ? Math.round(totalDays / totalStudents) : 0
            },

            // Color scheme for consistent visualization
            colors: {
                present: '#10B981',
                absent: '#EF4444',
                late: '#F59E0B',
                excellent: '#10B981',
                good: '#F59E0B',
                needsImprovement: '#EF4444',
                noAttendance: '#6B7280'
            }
        };

        const reportData = {
            title: 'Class-wise Attendance Report',
            dateRange: {
                from: fromDate,
                to: toDate,
                totalDays: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
            },
            grade: gradeName,
            section: sectionName,
            gender: gender || 'All',
            academicYear,
            summary: {
                totalStudents,
                totalPresentDays,
                totalAbsentDays,
                totalLateDays,
                totalDays,
                overallAttendancePercentage
            },
            students,
            visualData
        };

        res.status(200).json({
            status: 'success',
            message: 'Classwise attendance report generated successfully',
            data: reportData
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error generating classwise attendance report',
            error: error.message
        });
    }
});

// Get today's overall attendance report
exports.getTodayOverallReport = catchAsync(async (req, res) => {
    try {
        // Get current date (today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get current academic year
        const currentSettings = await Settings.findOne().populate('academicYear');
        if (!currentSettings) {
            return res.status(500).json({
                status: 'error',
                message: 'System settings not configured'
            });
        }

        const academicYear = currentSettings.academicYear._id;

        // Get all grades with their attendance data for today
        const gradeAttendanceData = await Attendance.aggregate([
            {
                $match: {
                    date: {
                        $gte: today,
                        $lt: tomorrow
                    },
                    academicYear: academicYear,
                    student: { $exists: true, $ne: null }
                }
            },
            {
                $lookup: {
                    from: 'academicstudents',
                    localField: 'student',
                    foreignField: 'studentId',
                    as: 'academicStudent'
                }
            },
            {
                $unwind: '$academicStudent'
            },
            {
                $lookup: {
                    from: 'students',
                    localField: 'student',
                    foreignField: '_id',
                    as: 'studentInfo'
                }
            },
            {
                $unwind: '$studentInfo'
            },
            {
                $group: {
                    _id: '$academicStudent.grade',
                    totalStudents: { $sum: 1 },
                    presentStudents: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
                        }
                    },
                    absentStudents: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
                        }
                    },
                    lateStudents: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'grades',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'gradeInfo'
                }
            },
            {
                $unwind: '$gradeInfo'
            },
            {
                $project: {
                    gradeId: '$_id',
                    gradeName: '$gradeInfo.gradeName',
                    totalStudents: 1,
                    presentStudents: 1,
                    absentStudents: 1,
                    lateStudents: 1,
                    attendancePercentage: {
                        $round: [
                            {
                                $multiply: [
                                    {
                                        $divide: ['$presentStudents', '$totalStudents']
                                    },
                                    100
                                ]
                            },
                            2
                        ]
                    }
                }
            },
            {
                $sort: { gradeName: 1 }
            }
        ]);

        // Get total registered students by grade for comparison
        const totalRegisteredStudents = await AcademicStudent.aggregate([
            {
                $match: {
                    academicYear: academicYear
                }
            },
            {
                $group: {
                    _id: '$grade',
                    totalRegistered: { $sum: 1 }
                }
            }
        ]);

        // Create a map of total registered students by grade
        const registeredMap = new Map();
        totalRegisteredStudents.forEach(item => {
            registeredMap.set(item._id.toString(), item.totalRegistered);
        });

        // Enhance the grade attendance data with total registered students
        const enhancedGradeData = gradeAttendanceData.map(grade => {
            const totalRegistered = registeredMap.get(grade.gradeId.toString()) || 0;
            const notMarked = totalRegistered - grade.totalStudents;
            
            return {
                ...grade,
                totalRegistered,
                notMarked,
                markedPercentage: totalRegistered > 0 ? Math.round((grade.totalStudents / totalRegistered) * 100) : 0
            };
        });

        // Calculate overall statistics
        const overallStats = enhancedGradeData.reduce((acc, grade) => {
            acc.totalStudents += grade.totalRegistered;
            acc.presentStudents += grade.presentStudents;
            acc.absentStudents += grade.absentStudents;
            acc.lateStudents += grade.lateStudents;
            acc.markedStudents += grade.totalStudents;
            acc.notMarkedStudents += grade.notMarked;
            return acc;
        }, {
            totalStudents: 0,
            presentStudents: 0,
            absentStudents: 0,
            lateStudents: 0,
            markedStudents: 0,
            notMarkedStudents: 0
        });

        overallStats.overallAttendancePercentage = overallStats.markedStudents > 0 
            ? Math.round((overallStats.presentStudents / overallStats.markedStudents) * 100) 
            : 0;

        overallStats.overallMarkedPercentage = overallStats.totalStudents > 0 
            ? Math.round((overallStats.markedStudents / overallStats.totalStudents) * 100) 
            : 0;

        // Prepare visual data for charts
        const visualData = {
            // Pie chart data for overall attendance distribution
            overallDistribution: [
                {
                    label: 'Present',
                    value: overallStats.presentStudents,
                    percentage: overallStats.markedStudents > 0 ? Math.round((overallStats.presentStudents / overallStats.markedStudents) * 100) : 0,
                    color: '#10B981'
                },
                {
                    label: 'Absent',
                    value: overallStats.absentStudents,
                    percentage: overallStats.markedStudents > 0 ? Math.round((overallStats.absentStudents / overallStats.markedStudents) * 100) : 0,
                    color: '#EF4444'
                },
                {
                    label: 'Late',
                    value: overallStats.lateStudents,
                    percentage: overallStats.markedStudents > 0 ? Math.round((overallStats.lateStudents / overallStats.markedStudents) * 100) : 0,
                    color: '#F59E0B'
                },
                {
                    label: 'Not Marked',
                    value: overallStats.notMarkedStudents,
                    percentage: overallStats.totalStudents > 0 ? Math.round((overallStats.notMarkedStudents / overallStats.totalStudents) * 100) : 0,
                    color: '#6B7280'
                }
            ],

            // Bar chart data for grade-wise attendance
            gradeAttendance: enhancedGradeData.map(grade => ({
                gradeName: grade.gradeName,
                totalStudents: grade.totalRegistered,
                presentStudents: grade.presentStudents,
                absentStudents: grade.absentStudents,
                lateStudents: grade.lateStudents,
                notMarked: grade.notMarked,
                attendancePercentage: grade.attendancePercentage,
                markedPercentage: grade.markedPercentage,
                color: grade.attendancePercentage >= 90 ? '#10B981' : 
                       grade.attendancePercentage >= 75 ? '#F59E0B' : '#EF4444'
            })),

            // Performance indicators
            performanceIndicators: {
                excellent: enhancedGradeData.filter(g => g.attendancePercentage >= 90).length,
                good: enhancedGradeData.filter(g => g.attendancePercentage >= 75 && g.attendancePercentage < 90).length,
                needsImprovement: enhancedGradeData.filter(g => g.attendancePercentage < 75).length,
                noAttendance: enhancedGradeData.filter(g => g.totalStudents === 0).length
            }
        };

        const reportData = {
            title: "Today's Overall Attendance Report",
            reportDate: today.toISOString().split('T')[0],
            academicYear: currentSettings.academicYear.academicYear,
            summary: {
                totalStudents: overallStats.totalStudents,
                markedStudents: overallStats.markedStudents,
                notMarkedStudents: overallStats.notMarkedStudents,
                presentStudents: overallStats.presentStudents,
                absentStudents: overallStats.absentStudents,
                lateStudents: overallStats.lateStudents,
                overallAttendancePercentage: overallStats.overallAttendancePercentage,
                overallMarkedPercentage: overallStats.overallMarkedPercentage
            },
            gradeData: enhancedGradeData,
            visualData
        };

        res.status(200).json({
            status: 'success',
            message: "Today's overall attendance report generated successfully",
            data: reportData
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error generating today\'s overall attendance report',
            error: error.message
        });
    }
});

// Get term-wise attendance report
// Helper function to calculate comprehensive analytics
const calculateAnalytics = (attendanceData, students, totalDays) => {
    // Gender-wise analytics
    const genderStats = {};
    students.forEach(student => {
        if (!genderStats[student.gender]) {
            genderStats[student.gender] = {
                count: 0,
                totalPresentDays: 0,
                totalAbsentDays: 0,
                totalLateDays: 0,
                averageAttendance: 0
            };
        }
        genderStats[student.gender].count++;
        genderStats[student.gender].totalPresentDays += student.presentDays;
        genderStats[student.gender].totalAbsentDays += student.absentDays;
        genderStats[student.gender].totalLateDays += student.lateDays;
    });

    // Calculate averages for each gender
    Object.keys(genderStats).forEach(gender => {
        const stats = genderStats[gender];
        stats.averageAttendance = totalDays > 0 ? 
            Math.round((stats.totalPresentDays / (stats.count * totalDays)) * 100) : 0;
    });

    // Section-wise analytics
    const sectionStats = {};
    students.forEach(student => {
        if (!sectionStats[student.section]) {
            sectionStats[student.section] = {
                count: 0,
                totalPresentDays: 0,
                totalAbsentDays: 0,
                totalLateDays: 0,
                averageAttendance: 0
            };
        }
        sectionStats[student.section].count++;
        sectionStats[student.section].totalPresentDays += student.presentDays;
        sectionStats[student.section].totalAbsentDays += student.absentDays;
        sectionStats[student.section].totalLateDays += student.lateDays;
    });

    // Calculate averages for each section
    Object.keys(sectionStats).forEach(section => {
        const stats = sectionStats[section];
        stats.averageAttendance = totalDays > 0 ? 
            Math.round((stats.totalPresentDays / (stats.count * totalDays)) * 100) : 0;
    });

    // Performance categories
    const performanceCategories = {
        excellent: { min: 90, count: 0, students: [] },
        good: { min: 75, max: 89, count: 0, students: [] },
        average: { min: 60, max: 74, count: 0, students: [] },
        needsImprovement: { min: 0, max: 59, count: 0, students: [] }
    };

    students.forEach(student => {
        if (student.attendancePercentage >= 90) {
            performanceCategories.excellent.count++;
            performanceCategories.excellent.students.push(student.studentName);
        } else if (student.attendancePercentage >= 75) {
            performanceCategories.good.count++;
            performanceCategories.good.students.push(student.studentName);
        } else if (student.attendancePercentage >= 60) {
            performanceCategories.average.count++;
            performanceCategories.average.students.push(student.studentName);
        } else {
            performanceCategories.needsImprovement.count++;
            performanceCategories.needsImprovement.students.push(student.studentName);
        }
    });

    // Monthly/weekly trends (if we have enough data)
    const dateWiseStats = {};
    attendanceData.forEach(record => {
        const dateKey = new Date(record.date).toISOString().split('T')[0];
        if (!dateWiseStats[dateKey]) {
            dateWiseStats[dateKey] = {
                present: 0,
                absent: 0,
                late: 0,
                total: 0
            };
        }
        dateWiseStats[dateKey][record.status]++;
        dateWiseStats[dateKey].total++;
    });

    // Calculate trend indicators
    const dates = Object.keys(dateWiseStats).sort();
    let trend = 'stable';
    if (dates.length >= 2) {
        const firstHalf = dates.slice(0, Math.floor(dates.length / 2));
        const secondHalf = dates.slice(Math.floor(dates.length / 2));
        
        const firstHalfAvg = firstHalf.reduce((sum, date) => 
            sum + (dateWiseStats[date].present / dateWiseStats[date].total), 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, date) => 
            sum + (dateWiseStats[date].present / dateWiseStats[date].total), 0) / secondHalf.length;
        
        if (secondHalfAvg > firstHalfAvg + 0.1) trend = 'improving';
        else if (secondHalfAvg < firstHalfAvg - 0.1) trend = 'declining';
    }

    // Top performers and areas of concern
    const topPerformers = students
        .filter(student => student.attendancePercentage >= 90)
        .slice(0, 5)
        .map(student => ({
            name: student.studentName,
            percentage: student.attendancePercentage,
            presentDays: student.presentDays
        }));

    const areasOfConcern = students
        .filter(student => student.attendancePercentage < 75)
        .slice(0, 5)
        .map(student => ({
            name: student.studentName,
            percentage: student.attendancePercentage,
            absentDays: student.absentDays,
            reason: student.attendancePercentage < 60 ? 'Critical' : 'Needs Attention'
        }));

    return {
        genderAnalysis: genderStats,
        sectionAnalysis: sectionStats,
        performanceBreakdown: performanceCategories,
        trends: {
            overall: trend,
            dateWiseStats: dateWiseStats,
            totalDates: dates.length
        },
        highlights: {
            topPerformers,
            areasOfConcern,
            bestSection: Object.entries(sectionStats)
                .sort(([,a], [,b]) => b.averageAttendance - a.averageAttendance)[0]?.[0] || 'N/A',
            bestGender: Object.entries(genderStats)
                .sort(([,a], [,b]) => b.averageAttendance - a.averageAttendance)[0]?.[0] || 'N/A'
        },
        insights: {
            mostConsistentStudent: topPerformers[0] || null,
            mostChallengedStudent: areasOfConcern[0] || null,
            attendanceGap: Math.max(...students.map(s => s.attendancePercentage)) - 
                           Math.min(...students.map(s => s.attendancePercentage)),
            consistencyScore: Math.round(students.reduce((sum, s) => sum + s.attendancePercentage, 0) / students.length)
        },
        recommendations: generateRecommendations(performanceCategories, sectionStats, genderStats)
    };
};

// Helper function to generate recommendations
const generateRecommendations = (performanceCategories, sectionStats, genderStats) => {
    const recommendations = [];

    if (performanceCategories.needsImprovement.count > 0) {
        recommendations.push({
            type: 'critical',
            message: `${performanceCategories.needsImprovement.count} students have attendance below 60%. Immediate intervention required.`,
            action: 'Schedule parent meetings and implement attendance improvement plans.'
        });
    }

    if (performanceCategories.average.count > performanceCategories.excellent.count) {
        recommendations.push({
            type: 'warning',
            message: 'More students in average category than excellent. Focus on improvement strategies.',
            action: 'Implement reward systems and attendance incentives.'
        });
    }

    // Section-based recommendations
    const sectionAverages = Object.entries(sectionStats).map(([section, stats]) => ({
        section,
        average: stats.averageAttendance
    })).sort((a, b) => a.average - b.average);

    if (sectionAverages.length > 1) {
        const lowestSection = sectionAverages[0];
        const highestSection = sectionAverages[sectionAverages.length - 1];
        
        if (highestSection.average - lowestSection.average > 20) {
            recommendations.push({
                type: 'info',
                message: `Significant performance gap between sections. ${lowestSection.section} needs support.`,
                action: 'Share best practices from high-performing sections.'
            });
        }
    }

    // Gender-based recommendations
    const genderAverages = Object.entries(genderStats).map(([gender, stats]) => ({
        gender,
        average: stats.averageAttendance
    })).sort((a, b) => a.average - b.average);

    if (genderAverages.length > 1) {
        const lowestGender = genderAverages[0];
        const highestGender = genderAverages[genderAverages.length - 1];
        
        if (highestGender.average - lowestGender.average > 15) {
            recommendations.push({
                type: 'info',
                message: `Gender-based attendance gap detected. ${lowestGender.gender} students need targeted support.`,
                action: 'Investigate underlying causes and implement gender-specific strategies.'
            });
        }
    }

    if (recommendations.length === 0) {
        recommendations.push({
            type: 'success',
            message: 'Overall attendance performance is good across all categories.',
            action: 'Maintain current strategies and continue monitoring.'
        });
    }

    return recommendations;
};

exports.getTermwiseAttendanceReport = catchAsync(async (req, res) => {
    
    const { academicYear, term, grade, gender, section } = req.query;

    if (!academicYear || !term) {
        return res.status(400).json({
            status: 'error',
            message: 'Academic year and term are required'
        });
    }

    try {
        // Normalize term name (trim whitespace and handle URL encoding)
        const normalizedTerm = term.trim();
        
        // Get term information from term history
        // First try to find with isActive: true
        let termHistory = await TermHistory.findOne({
            academicYear: academicYear,
            term: normalizedTerm
        }).populate('academicYear');

        if (!termHistory) {
            return res.status(404).json({
                status: 'error',
                message: 'Term not found for the specified academic year'
            });
        }

        // Parse the dates from term history
        const startDate = new Date(termHistory.startDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(termHistory.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        console.log('Term Start Date:', startDate);
        console.log('Term End Date:', endDate);
        console.log('Term History:', termHistory);

        // Base query for the date range
        const baseQuery = {
            date: {
                $gte: startDate,
                $lte: endDate
            },
            isActive: true,
            attendanceType: 'student'
        };

        // Add academic year filter if provided
        if (academicYear) {
            try {
                baseQuery.academicYear = mongoose.Types.ObjectId(academicYear);
            } catch (error) {
                baseQuery.academicYear = academicYear;
            }
        }

        // Add grade filter if provided
        if (grade) {
            try {
                baseQuery.grade = mongoose.Types.ObjectId(grade);
            } catch (error) {
                baseQuery.grade = grade;
            }
        }

        // Note: Gender filtering is handled through AcademicStudent lookup, not directly on Attendance

        // Note: Section filtering is handled through AcademicStudent lookup, not directly on Attendance

        console.log('Base Query:', JSON.stringify(baseQuery, null, 2));
        
        // Get attendance data for the term period using basic find with populate
        const attendanceData = await Attendance.find(baseQuery)
            .populate('student', 'studentName studentID')
            .populate('grade', 'gradeName')
            .populate('academicYear')
            .lean();

        console.log('Attendance Data Count:', attendanceData.length);
        console.log('Sample Attendance Record:', attendanceData[0]);

        // Get AcademicStudent data to populate section and gender
        const uniqueStudents = [...new Set(attendanceData.map(record => record.student._id.toString()))];
        console.log('Unique Students:', uniqueStudents);
        
        // Build AcademicStudent query with section filtering
        const academicStudentQuery = {
            studentId: { $in: uniqueStudents }
        };
        
        // Add section filter if provided
        if (section) {
            try {
                academicStudentQuery.section = mongoose.Types.ObjectId(section);
            } catch (error) {
                academicStudentQuery.section = section;
            }
        }
        
        // Add gender filter if provided
        if (gender) {
            academicStudentQuery.gender = { $regex: new RegExp(`^${gender}$`, 'i') };
        }
        
        const academicStudents = await AcademicStudent.find(academicStudentQuery)
            .populate('section', 'sectionName')
            .lean();

        console.log('AcademicStudent Data Count:', academicStudents.length);
        console.log('Sample AcademicStudent Record:', academicStudents[0]);

        // Create a map for quick lookup - only use studentId as key since that's the unique identifier
        const academicStudentMap = {};
        academicStudents.forEach(academicStudent => {
            const key = academicStudent.studentId.toString();
            academicStudentMap[key] = academicStudent;
        });
        
        console.log('AcademicStudent Map Keys:', Object.keys(academicStudentMap));
        console.log('AcademicStudent Map Sample:', Object.values(academicStudentMap)[0]);

        

        // Enrich attendance data with AcademicStudent information
        // Only include records that have matching AcademicStudent data (after filtering)
        const enrichedAttendanceData = attendanceData
            .map(attendance => {
                const key = attendance.student._id.toString();
                const academicStudent = academicStudentMap[key];
                
                // Only return data if we have AcademicStudent information
                if (!academicStudent) {
                    console.log(`No AcademicStudent found for student: ${key}`);
                    return null;
                }
                
                return {
                    _id: attendance._id,
                    date: attendance.date,
                    status: attendance.status,
                    student: {
                        _id: attendance.student._id,
                        fullName: attendance.student.studentName || attendance.student.studentID,
                        gender: academicStudent.gender
                    },
                    grade: {
                        _id: attendance.grade._id,
                        gradeName: attendance.grade.gradeName
                    },
                    section: {
                        _id: academicStudent.section._id,
                        sectionName: academicStudent.section.sectionName
                    }
                };
            })
            .filter(record => record !== null); // Remove null records

            console.log({enrichedAttendanceData})

        // Calculate term statistics
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        // Group attendance by student
        const studentStats = {};
        
        enrichedAttendanceData.forEach(record => {
            const studentId = record.student._id;
            const studentName = record.student.fullName || 'Unknown';
            const grade = record.grade?.gradeName || 'Unknown';
            const section = record.section?.sectionName || 'Unknown';
            const gender = record.student?.gender || 'Unknown';
            
            if (!studentStats[studentId]) {
                studentStats[studentId] = {
                    studentId,
                    studentName,
                    grade,
                    section,
                    gender,
                    totalDays: 0,
                    presentDays: 0,
                    absentDays: 0,
                    lateDays: 0,
                    attendancePercentage: 0
                };
            }
            
            studentStats[studentId].totalDays++;
            
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

        console.log({enrichedAttendanceData})

        // Calculate percentages and overall stats
        const students = Object.values(studentStats);
        const totalStudents = students.length;
        let totalPresentDays = 0;
        let totalAbsentDays = 0;
        let totalLateDays = 0;

        let totalAttendanceDays = 0; // Total days with attendance records across all students
        
        students.forEach(student => {
            // Calculate percentage based on student's actual attendance days (days with attendance records)
            // This gives the percentage of present days out of days with attendance records
            // Example: 1 present out of 2 total attendance days = 50%
            student.attendancePercentage = student.totalDays > 0 ? 
                Math.round((student.presentDays / student.totalDays) * 100) : 0;
            totalPresentDays += student.presentDays;
            totalAbsentDays += student.absentDays;
            totalLateDays += student.lateDays;
            totalAttendanceDays += student.totalDays; // Sum of all attendance record days
        });

        // Calculate overall attendance percentage based on actual attendance days recorded
        // This gives the percentage of present days out of total attendance days recorded
        const overallAttendancePercentage = totalAttendanceDays > 0 ? 
            Math.round((totalPresentDays / totalAttendanceDays) * 100) : 0;

        // Calculate additional summary statistics
        const averageAttendancePerStudent = totalStudents > 0 ? 
            Math.round(totalPresentDays / totalStudents) : 0;
        const totalExpectedDays = totalStudents * totalDays;
        // Attendance efficiency based on term's total days (for comparison with expected)
        const attendanceEfficiency = totalExpectedDays > 0 ? 
            Math.round((totalPresentDays / totalExpectedDays) * 100) : 0;
        
        // Calculate additional analytics
        const analytics = calculateAnalytics(enrichedAttendanceData, students, totalDays);

        const reportData = {
            termInfo: {
                term: termHistory.term,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                totalDays,
                academicYear: termHistory.academicYear.academicYear
            },
            summary: {
                totalStudents,
                totalPresentDays,
                totalAbsentDays,
                totalLateDays,
                overallAttendancePercentage,
                averageAttendancePerStudent,
                totalExpectedDays,
                attendanceEfficiency,
                totalLatePercentage: totalExpectedDays > 0 ? 
                    Math.round((totalLateDays / totalExpectedDays) * 100) : 0,
                totalAbsentPercentage: totalExpectedDays > 0 ? 
                    Math.round((totalAbsentDays / totalExpectedDays) * 100) : 0
            },
            analytics: analytics,
            students: students.sort((a, b) => b.attendancePercentage - a.attendancePercentage)
        };

        res.status(200).json({
            status: 'success',
            message: 'Term-wise attendance report generated successfully',
            data: reportData
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error generating term-wise attendance report',
            error: error.message
        });
    }
});

// Generate attendance summary statistics
exports.generateAttendanceSummary = catchAsync(async (req, res) => {
    try {
        const { 
            startDate, 
            endDate, 
            academicYear, 
            grade, 
            section, 
            summaryType = 'overall' 
        } = req.query;

        // Validate required parameters
        if (!startDate || !endDate) {
            return res.status(400).json({
                status: 'error',
                message: 'Start date and end date are required'
            });
        }

        // Build base query
        const baseQuery = {
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            },
            attendanceType: 'student',
            isActive: true
        };

        // Add filters
        if (academicYear) {
            try {
                baseQuery.academicYear = mongoose.Types.ObjectId(academicYear);
            } catch (error) {
                baseQuery.academicYear = academicYear;
            }
        }

        if (grade) {
            try {
                baseQuery.grade = mongoose.Types.ObjectId(grade);
            } catch (error) {
                baseQuery.grade = grade;
            }
        }

        // Get only the necessary fields for summary calculation
        const attendanceData = await Attendance.find(baseQuery)
            .select('date status student grade academicYear')
            .populate('student', 'studentName studentID')
            .populate('grade', 'gradeName')
            .lean();

        // Get unique students for summary
        const uniqueStudents = [...new Set(attendanceData.map(record => record.student._id.toString()))];
        
        // Get AcademicStudent data for the unique students in one query
        const academicStudents = await AcademicStudent.find({
            studentId: { $in: uniqueStudents },
            academicYear: academicYear || { $exists: true },
            grade: grade || { $exists: true }
        }).populate('section', 'sectionName').lean();

        // Create a lookup map for faster access
        const academicStudentMap = {};
        academicStudents.forEach(academicStudent => {
            const key = `${academicStudent.studentId}_${academicStudent.academicYear}_${academicStudent.grade}`;
            academicStudentMap[key] = academicStudent;
        });

        // Generate summary based on type
        let summary;
        switch (summaryType) {
            case 'daily':
                summary = generateDailySummary(attendanceData, academicStudentMap, startDate, endDate);
                break;
            case 'student':
                summary = generateStudentSummary(attendanceData, academicStudentMap, startDate, endDate);
                break;
            case 'grade':
                summary = generateGradeSummary(attendanceData, academicStudentMap);
                break;
            case 'section':
                summary = generateSectionSummary(attendanceData, academicStudentMap);
                break;
            default:
                summary = generateOverallSummary(attendanceData, academicStudentMap, startDate, endDate);
        }

        res.status(200).json({
            status: 'success',
            message: 'Attendance summary generated successfully',
            data: summary
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error generating attendance summary',
            error: error.message
        });
    }
});

// Helper function to format attendance data consistently
const formatAttendanceData = (attendance, academicStudent = null) => {
    const baseData = {
        _id: attendance._id,
        date: attendance.date,
        status: attendance.status,
        timeIn: attendance.timeIn,
        timeOut: attendance.timeOut,
        attendanceType: attendance.attendanceType,
        attendanceMethod: attendance.attendanceMethod,
        notes: attendance.notes,
        remarks: attendance.remarks,
        isActive: attendance.isActive,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
        
        // Student information
        student: {
            _id: attendance.student?._id,
            studentName: attendance.student?.studentName || attendance.student?.name,
            studentID: attendance.student?.studentID || attendance.student?.rollNumber,
            gender: academicStudent?.gender || attendance.student?.gender || 'Unknown'
        },
        
        // Grade information
        grade: {
            _id: attendance.grade?._id,
            gradeName: attendance.grade?.gradeName || attendance.grade?.grade
        },
        
        // Section information from AcademicStudent
        section: academicStudent?.section ? {
            _id: academicStudent.section._id,
            sectionName: academicStudent.section.sectionName
        } : null,
        
        // Academic year information
        academicYear: {
            _id: attendance.academicYear?._id,
            academicYear: attendance.academicYear?.academicYear
        },
        
        // Academic student context
        academicStudent: academicStudent ? {
            _id: academicStudent._id,
            status: academicStudent.status,
            startDate: academicStudent.startDate,
            endDate: academicStudent.endDate,
            isActive: academicStudent.status === 'active'
        } : null,
        
        // Calculated fields
        duration: attendance.timeOut && attendance.timeIn ? 
            Math.round((new Date(attendance.timeOut) - new Date(attendance.timeIn)) / (1000 * 60 * 60)) : null,
        isLate: attendance.timeIn ? 
            new Date(attendance.timeIn).getHours() > 8 : false
    };

    // Add teacher information if present
    if (attendance.teacher) {
        baseData.teacher = {
            _id: attendance.teacher._id,
            name: attendance.teacher.name,
            employeeId: attendance.teacher.employeeId
        };
    }

    return baseData;
};

// Helper functions for generating different summary types
const generateOverallSummary = (data, academicStudentMap, startDate, endDate) => {
    const totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    
    // Count by status
    const statusCounts = data.reduce((acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
    }, {});
    
    // Get unique students
    const uniqueStudents = [...new Set(data.map(record => record.student._id.toString()))];
    const totalStudents = uniqueStudents.length;
    
    // Calculate percentages
    const totalRecords = data.length;
    const presentPercentage = totalRecords > 0 ? Math.round((statusCounts.present || 0) / totalRecords * 100) : 0;
    const absentPercentage = totalRecords > 0 ? Math.round((statusCounts.absent || 0) / totalRecords * 100) : 0;
    const latePercentage = totalRecords > 0 ? Math.round((statusCounts.late || 0) / totalRecords * 100) : 0;
    
    return {
        period: {
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            totalDays
        },
        overview: {
            totalStudents,
            totalRecords,
            averageAttendancePerDay: totalDays > 0 ? Math.round(totalRecords / totalDays) : 0
        },
        statusBreakdown: {
            present: {
                count: statusCounts.present || 0,
                percentage: presentPercentage
            },
            absent: {
                count: statusCounts.absent || 0,
                percentage: absentPercentage
            },
            late: {
                count: statusCounts.late || 0,
                percentage: latePercentage
            },
            'half-day': {
                count: statusCounts['half-day'] || 0,
                percentage: totalRecords > 0 ? Math.round((statusCounts['half-day'] || 0) / totalRecords * 100) : 0
            },
            leave: {
                count: statusCounts.leave || 0,
                percentage: totalRecords > 0 ? Math.round((statusCounts.leave || 0) / totalRecords * 100) : 0
            }
        },
        overallAttendancePercentage: presentPercentage
    };
};

const generateDailySummary = (data, academicStudentMap, startDate, endDate) => {
    const dailyStats = {};
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Initialize daily stats
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        dailyStats[dateKey] = {
            date: dateKey,
            totalStudents: 0,
            present: 0,
            absent: 0,
            late: 0,
            'half-day': 0,
            leave: 0,
            attendancePercentage: 0
        };
    }
    
    // Group data by date
    data.forEach(record => {
        const dateKey = new Date(record.date).toISOString().split('T')[0];
        if (dailyStats[dateKey]) {
            dailyStats[dateKey].totalStudents++;
            dailyStats[dateKey][record.status]++;
        }
    });
    
    // Calculate percentages for each day
    Object.values(dailyStats).forEach(day => {
        const total = day.totalStudents;
        if (total > 0) {
            day.attendancePercentage = Math.round((day.present / total) * 100);
        }
    });
    
    return {
        period: {
            startDate: start.toISOString(),
            endDate: end.toISOString()
        },
        dailyBreakdown: Object.values(dailyStats),
        summary: {
            averageDailyAttendance: Math.round(
                Object.values(dailyStats).reduce((sum, day) => sum + day.attendancePercentage, 0) / 
                Object.values(dailyStats).length
            ),
            bestDay: Object.values(dailyStats).reduce((best, current) => 
                current.attendancePercentage > best.attendancePercentage ? current : best
            ),
            worstDay: Object.values(dailyStats).reduce((worst, current) => 
                current.attendancePercentage < worst.attendancePercentage ? current : worst
            )
        }
    };
};

const generateStudentSummary = (data, academicStudentMap, startDate, endDate) => {
    const totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    const studentStats = {};
    
    // Group by student
    data.forEach(record => {
        const studentId = record.student._id.toString();
        if (!studentStats[studentId]) {
            // Get AcademicStudent info for this student
            const key = `${record.student._id}_${record.academicYear}_${record.grade._id}`;
            const academicStudent = academicStudentMap[key];
            
            studentStats[studentId] = {
                student: {
                    _id: record.student._id,
                    name: record.student.studentName,
                    studentID: record.student.studentID,
                    gender: academicStudent?.gender || 'Unknown'
                },
                grade: record.grade,
                section: academicStudent?.section || null,
                totalDays: 0,
                present: 0,
                absent: 0,
                late: 0,
                'half-day': 0,
                leave: 0,
                attendancePercentage: 0
            };
        }
        
        studentStats[studentId].totalDays++;
        studentStats[studentId][record.status]++;
    });
    
    // Calculate percentages for each student
    Object.values(studentStats).forEach(student => {
        if (student.totalDays > 0) {
            student.attendancePercentage = Math.round((student.present / student.totalDays) * 100);
        }
    });
    
    // Sort by attendance percentage (descending)
    const sortedStudents = Object.values(studentStats).sort((a, b) => b.attendancePercentage - a.attendancePercentage);
    
    return {
        period: {
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            totalDays
        },
        totalStudents: sortedStudents.length,
        students: sortedStudents,
        summary: {
            topPerformers: sortedStudents.slice(0, 5),
            needsAttention: sortedStudents.filter(s => s.attendancePercentage < 75).slice(0, 5),
            averageAttendance: Math.round(
                sortedStudents.reduce((sum, student) => sum + student.attendancePercentage, 0) / 
                sortedStudents.length
            )
        }
    };
};

const generateGradeSummary = (data, academicStudentMap) => {
    const gradeStats = {};
    
    // Group by grade
    data.forEach(record => {
        const gradeId = record.grade._id;
        if (!gradeStats[gradeId]) {
            gradeStats[gradeId] = {
                grade: record.grade,
                totalStudents: 0,
                totalRecords: 0,
                present: 0,
                absent: 0,
                late: 0,
                'half-day': 0,
                leave: 0,
                attendancePercentage: 0
            };
        }
        
        gradeStats[gradeId].totalStudents++;
        gradeStats[gradeId].totalRecords++;
        gradeStats[gradeId][record.status]++;
    });
    
    // Calculate percentages for each grade
    Object.values(gradeStats).forEach(grade => {
        if (grade.totalRecords > 0) {
            grade.attendancePercentage = Math.round((grade.present / grade.totalRecords) * 100);
        }
    });
    
    // Sort by attendance percentage (descending)
    const sortedGrades = Object.values(gradeStats).sort((a, b) => b.attendancePercentage - a.attendancePercentage);
    
    return {
        totalGrades: sortedGrades.length,
        grades: sortedGrades,
        summary: {
            bestGrade: sortedGrades[0],
            worstGrade: sortedGrades[sortedGrades.length - 1],
            averageGradeAttendance: Math.round(
                sortedGrades.reduce((sum, grade) => sum + grade.attendancePercentage, 0) / 
                sortedGrades.length
            )
        }
    };
};

const generateSectionSummary = (data, academicStudentMap) => {
    const sectionStats = {};
    
    // Group by section
    data.forEach(record => {
        // Get AcademicStudent info for this record
        const key = `${record.student._id}_${record.academicYear}_${record.grade._id}`;
        const academicStudent = academicStudentMap[key];
        
        if (academicStudent?.section) {
            const sectionId = academicStudent.section._id;
            if (!sectionStats[sectionId]) {
                sectionStats[sectionId] = {
                    section: academicStudent.section,
                    totalStudents: 0,
                    totalRecords: 0,
                    present: 0,
                    absent: 0,
                    late: 0,
                    'half-day': 0,
                    leave: 0,
                    attendancePercentage: 0
                };
            }
            
            sectionStats[sectionId].totalStudents++;
            sectionStats[sectionId].totalRecords++;
            sectionStats[sectionId][record.status]++;
        }
    });
    
    // Calculate percentages for each section
    Object.values(sectionStats).forEach(section => {
        if (section.totalRecords > 0) {
            section.attendancePercentage = Math.round((section.present / section.totalRecords) * 100);
        }
    });
    
    // Sort by attendance percentage (descending)
    const sortedSections = Object.values(sectionStats).sort((a, b) => b.attendancePercentage - a.attendancePercentage);
    
    return {
        totalSections: sortedSections.length,
        sections: sortedSections,
        summary: {
            bestSection: sortedSections[0],
            worstSection: sortedSections[sortedSections.length - 1],
            averageSectionAttendance: Math.round(
                sortedSections.reduce((sum, section) => sum + section.attendancePercentage, 0) / 
                sortedSections.length
            )
        }
    };
};