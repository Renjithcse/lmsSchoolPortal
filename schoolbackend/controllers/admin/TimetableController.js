const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const Timetable = require('../../models/Admin/Timetable');
const GradeSubject = require('../../models/Admin/GradeSubject');
const Setting = require('../../models/Admin/Settings');
const Grade = require('../../models/Admin/Grade');
const Section = require('../../models/Admin/Section');
const Subject = require('../../models/Admin/Subject');
const Teacher = require('../../models/users/Teacher');

// Create a new timetable
exports.createTimetable = catchAsync(async (req, res, next) => {
    let { 
        name,
        academicYear, 
        term, 
        grade, 
        gender, 
        section, 
        weeklyTimetable, 
        status = 'draft'
    } = req.body;

    // If academicYear is not provided, get it from current settings
    if (!academicYear) {
        const currentSettings = await Setting.findOne().populate('academicYear');
        
        if (!currentSettings || !currentSettings.academicYear) {
            return next(new AppError("Academic year not found. Please provide academicYear or configure system settings", 400));
        }
        
        academicYear = currentSettings.academicYear._id.toString();
    }

    // Validate required fields
    if (!name || !term || !grade || !gender || !section || !weeklyTimetable) {
        return next(new AppError("Please provide all required fields: name, term, grade, gender, section, and weeklyTimetable", 400));
    }

    // Check if timetable already exists for this combination
    const existingTimetable = await Timetable.findOne({
        academicYear,
        term,
        grade,
        gender,
        section
    });

    if (existingTimetable) {
        return next(new AppError("A timetable already exists for this grade, gender, section, academic year and term combination", 400));
    }

    // Get available subjects and teachers for this grade/gender/section/academic year
    const gradeSubjects = await GradeSubject.find({
        academicYear,
        grade,
        gender,
        section,
        Status: 'active'
    }).populate('subject teacher');

    if (gradeSubjects.length === 0) {
        return next(new AppError("No subjects found for this grade, gender, section and academic year combination", 400));
    }

    // Validate that all gradeSubjects in the timetable are valid for this class
    const validGradeSubjects = gradeSubjects
        .map(gs => gs._id.toString()); // Include all gradeSubjects, even those without teachers

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of days) {
        if (weeklyTimetable[day]) {
            for (const period of weeklyTimetable[day]) {
                if (!period.isBreak) {
                    // Validate gradeSubject if it's provided
                    if (period.gradeSubject && !validGradeSubjects.includes(period.gradeSubject.toString())) {
                        return next(new AppError(`GradeSubject ${period.gradeSubject} is not valid for this grade, gender, section combination`, 400));
                    }
                    
                    // Legacy validation for backward compatibility
                    if (period.subject) {
                        const validSubjects = gradeSubjects
                            .filter(gs => gs.subject)
                            .map(gs => gs.subject._id.toString());
                        if (!validSubjects.includes(period.subject.toString())) {
                            return next(new AppError(`Subject ${period.subject} is not assigned to this grade, gender, section combination`, 400));
                        }
                    }
                    if (period.teacher) {
                        const validTeachers = gradeSubjects
                            .filter(gs => gs.teacher)
                            .map(gs => gs.teacher._id.toString());
                        if (!validTeachers.includes(period.teacher.toString())) {
                            return next(new AppError(`Teacher ${period.teacher} is not assigned to this grade, gender, section combination`, 400));
                        }
                    }
                }
            }
        }
    }

    const timetable = await Timetable.create({
        name,
        academicYear,
        term,
        grade,
        gender,
        section,
        weeklyTimetable,
        status,
        createdBy: req.user.id
    });

    res.status(201).json({
        status: "success",
        data: timetable
    });
});

// Get all timetables with filters
exports.getAllTimetables = catchAsync(async (req, res, next) => {
    let { 
        academicYear, 
        term, 
        grade, 
        gender, 
        section, 
        status,
        page = 1,
        limit = 10
    } = req.query;

    // If academicYear is not provided, get it from current settings
    if (!academicYear) {
        const currentSettings = await Setting.findOne().populate('academicYear');
        
        if (currentSettings && currentSettings.academicYear) {
            academicYear = currentSettings.academicYear._id.toString();
        }
    }

    const query = {};
    
    if (academicYear) query.academicYear = academicYear;
    if (term) query.term = term;
    if (grade) query.grade = grade;
    if (gender) query.gender = gender;
    if (section) query.section = section;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const timetableDocs = await Timetable.find(query)
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('section', 'sectionName')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Timetable.countDocuments(query);

    // Optimize data population by fetching all needed data in batch queries
    const mongoose = require('mongoose');
    const GradeSubject = require('../../models/Admin/GradeSubject');
    const Subject = require('../../models/Admin/Subject');
    const Teacher = require('../../models/users/Teacher');
    
    // Collect all unique IDs that need to be populated
    const gradeSubjectIds = new Set();
    const subjectIds = new Set();
    const teacherIds = new Set();
    
    // First pass: collect all IDs that need to be populated
    for (const timetableDoc of timetableDocs) {
        const timetable = timetableDoc.toObject();
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        for (const day of days) {
            if (timetable.weeklyTimetable[day]) {
                for (const period of timetable.weeklyTimetable[day]) {
                    if (!period.isBreak) {
                        if (period.gradeSubject && mongoose.Types.ObjectId.isValid(period.gradeSubject)) {
                            gradeSubjectIds.add(period.gradeSubject.toString());
                        }
                        if (period.subject && mongoose.Types.ObjectId.isValid(period.subject)) {
                            subjectIds.add(period.subject.toString());
                        }
                        if (period.teacher && mongoose.Types.ObjectId.isValid(period.teacher)) {
                            teacherIds.add(period.teacher.toString());
                        }
                    }
                }
            }
        }
    }
    
    // Batch fetch all needed data
    const gradeSubjects = {};
    const subjects = {};
    const teachers = {};
    
    if (gradeSubjectIds.size > 0) {
        const gradeSubjectDocs = await GradeSubject.find({
            _id: { $in: Array.from(gradeSubjectIds) }
        }).populate('subject', 'subjectName').populate('teacher', 'employeeName employeeId');
        
        gradeSubjectDocs.forEach(gs => {
            gradeSubjects[gs._id.toString()] = gs;
        });
    }
    
    if (subjectIds.size > 0) {
        const subjectDocs = await Subject.find({
            _id: { $in: Array.from(subjectIds) }
        }).select('subjectName');
        
        subjectDocs.forEach(subject => {
            subjects[subject._id.toString()] = subject;
        });
    }
    
    if (teacherIds.size > 0) {
        const teacherDocs = await Teacher.find({
            _id: { $in: Array.from(teacherIds) }
        }).select('employeeName employeeId');
        
        teacherDocs.forEach(teacher => {
            teachers[teacher._id.toString()] = teacher;
        });
    }
    
    // Get all grade subjects for teacher lookup (for legacy data structure)
    const allGradeSubjects = await GradeSubject.find({ Status: 'active' })
        .populate('subject', 'subjectName')
        .populate('teacher', 'employeeName employeeId');
    
    // Create lookup map for grade subjects by academicYear, grade, gender, section, subject
    const gradeSubjectLookup = {};
    allGradeSubjects.forEach(gs => {
        const key = `${gs.academicYear}_${gs.grade}_${gs.gender}_${gs.section}_${gs.subject}`;
        gradeSubjectLookup[key] = gs;
    });
    
    // Second pass: populate the data using cached results
    const timetables = [];
    
    for (const timetableDoc of timetableDocs) {
        const timetable = timetableDoc.toObject();
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        for (const day of days) {
            if (timetable.weeklyTimetable[day]) {
                for (let i = 0; i < timetable.weeklyTimetable[day].length; i++) {
                    const period = timetable.weeklyTimetable[day][i];
                    
                    // Only populate for non-break periods
                    if (!period.isBreak) {
                        // If gradeSubject ID is available, populate from it
                        if (period.gradeSubject && mongoose.Types.ObjectId.isValid(period.gradeSubject)) {
                            const gradeSubject = gradeSubjects[period.gradeSubject.toString()];
                            if (gradeSubject) {
                                timetable.weeklyTimetable[day][i].subject = gradeSubject.subject;
                                timetable.weeklyTimetable[day][i].teacher = gradeSubject.teacher;
                            }
                        } else {
                            // Handle current frontend data structure where only subject IDs are stored
                            if (period.subject && mongoose.Types.ObjectId.isValid(period.subject)) {
                                // Populate the subject from cache
                                const subject = subjects[period.subject.toString()];
                                if (subject) {
                                    timetable.weeklyTimetable[day][i].subject = subject;
                                    
                                    // Try to find the teacher through gradeSubject lookup
                                    const lookupKey = `${timetable.academicYear}_${timetable.grade}_${timetable.gender}_${timetable.section}_${period.subject}`;
                                    const gradeSubject = gradeSubjectLookup[lookupKey];
                                    
                                    if (gradeSubject && gradeSubject.teacher) {
                                        timetable.weeklyTimetable[day][i].teacher = gradeSubject.teacher;
                                    }
                                }
                            }
                            
                            // Handle direct teacher ID if present (legacy support)
                            if (period.teacher && mongoose.Types.ObjectId.isValid(period.teacher)) {
                                const teacher = teachers[period.teacher.toString()];
                                if (teacher) {
                                    timetable.weeklyTimetable[day][i].teacher = teacher;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        timetables.push(timetable);
    }

    res.status(200).json({
        status: "success",
        results: timetables.length,
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        data: timetables
    });
});

// Get a specific timetable
exports.getTimetable = catchAsync(async (req, res, next) => {
    const timetableDoc = await Timetable.findById(req.params.id)
        .populate('academicYear', '_id academicYear')
        .populate('grade', 'gradeName')
        .populate('section', 'sectionName')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

    if (!timetableDoc) {
        return next(new AppError("No timetable found with this ID", 404));
    }

    // Convert to plain object for manipulation
    const timetable = timetableDoc.toObject();

    // Ensure academicYear._id is explicitly available for frontend
    // After populate and toObject(), academicYear should be an object with _id and academicYear
    // But we ensure _id is always available as a string
    if (timetable.academicYear) {
        if (typeof timetable.academicYear === 'object') {
            // If it's an object, ensure _id is available
            if (!timetable.academicYear._id) {
                // If _id is missing, get it from the original document
                timetable.academicYear._id = timetableDoc.academicYear?._id?.toString() || timetableDoc.academicYear?.toString() || timetable.academicYear;
            } else {
                // Ensure _id is a string
                timetable.academicYear._id = timetable.academicYear._id.toString();
            }
        } else {
            // If it's a string (ObjectId), convert to object with _id
            timetable.academicYear = {
                _id: timetable.academicYear.toString(),
                academicYear: ''
            };
        }
    }

    // Optimize data population by fetching all needed data in batch queries
    const mongoose = require('mongoose');
    const GradeSubject = require('../../models/Admin/GradeSubject');
    const Subject = require('../../models/Admin/Subject');
    const Teacher = require('../../models/users/Teacher');
    
    // Collect all unique IDs that need to be populated
    const gradeSubjectIds = new Set();
    const subjectIds = new Set();
    const teacherIds = new Set();
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    // First pass: collect all IDs that need to be populated
    for (const day of days) {
        if (timetable.weeklyTimetable[day]) {
            for (const period of timetable.weeklyTimetable[day]) {
                if (!period.isBreak) {
                    if (period.gradeSubject && mongoose.Types.ObjectId.isValid(period.gradeSubject)) {
                        gradeSubjectIds.add(period.gradeSubject.toString());
                    }
                    if (period.subject && mongoose.Types.ObjectId.isValid(period.subject)) {
                        subjectIds.add(period.subject.toString());
                    }
                    if (period.teacher && mongoose.Types.ObjectId.isValid(period.teacher)) {
                        teacherIds.add(period.teacher.toString());
                    }
                }
            }
        }
    }
    
    // Batch fetch all needed data
    const gradeSubjects = {};
    const subjects = {};
    const teachers = {};
    
    if (gradeSubjectIds.size > 0) {
        const gradeSubjectDocs = await GradeSubject.find({
            _id: { $in: Array.from(gradeSubjectIds) }
        }).populate('subject', 'subjectName').populate('teacher', 'employeeName employeeId');
        
        gradeSubjectDocs.forEach(gs => {
            gradeSubjects[gs._id.toString()] = gs;
        });
    }
    
    if (subjectIds.size > 0) {
        const subjectDocs = await Subject.find({
            _id: { $in: Array.from(subjectIds) }
        }).select('subjectName');
        
        subjectDocs.forEach(subject => {
            subjects[subject._id.toString()] = subject;
        });
    }
    
    if (teacherIds.size > 0) {
        const teacherDocs = await Teacher.find({
            _id: { $in: Array.from(teacherIds) }
        }).select('employeeName employeeId');
        
        teacherDocs.forEach(teacher => {
            teachers[teacher._id.toString()] = teacher;
        });
    }
    
    // Get all grade subjects for teacher lookup (for legacy data structure)
    const allGradeSubjects = await GradeSubject.find({ Status: 'active' })
        .populate('subject', 'subjectName')
        .populate('teacher', 'employeeName employeeId');
    
    // Create lookup map for grade subjects by academicYear, grade, gender, section, subject
    const gradeSubjectLookup = {};
    allGradeSubjects.forEach(gs => {
        const key = `${gs.academicYear}_${gs.grade}_${gs.gender}_${gs.section}_${gs.subject}`;
        gradeSubjectLookup[key] = gs;
    });
    
    // Second pass: populate the data using cached results
    for (const day of days) {
        if (timetable.weeklyTimetable[day]) {
            for (let i = 0; i < timetable.weeklyTimetable[day].length; i++) {
                const period = timetable.weeklyTimetable[day][i];
                
                // Only populate for non-break periods
                if (!period.isBreak) {
                    // If gradeSubject ID is available, populate from it
                    if (period.gradeSubject && mongoose.Types.ObjectId.isValid(period.gradeSubject)) {
                        const gradeSubject = gradeSubjects[period.gradeSubject.toString()];
                        if (gradeSubject) {
                            timetable.weeklyTimetable[day][i].subject = gradeSubject.subject;
                            timetable.weeklyTimetable[day][i].teacher = gradeSubject.teacher;
                        }
                    } else {
                        // Handle current frontend data structure where only subject IDs are stored
                        if (period.subject && mongoose.Types.ObjectId.isValid(period.subject)) {
                            // Populate the subject from cache
                            const subject = subjects[period.subject.toString()];
                            if (subject) {
                                timetable.weeklyTimetable[day][i].subject = subject;
                                
                                // Try to find the teacher through gradeSubject lookup
                                // Use academicYear._id if it's an object, otherwise use the string directly
                                const academicYearId = typeof timetable.academicYear === 'object' 
                                    ? timetable.academicYear._id || timetable.academicYear 
                                    : timetable.academicYear;
                                const lookupKey = `${academicYearId}_${timetable.grade}_${timetable.gender}_${timetable.section}_${period.subject}`;
                                const gradeSubject = gradeSubjectLookup[lookupKey];
                                
                                if (gradeSubject && gradeSubject.teacher) {
                                    timetable.weeklyTimetable[day][i].teacher = gradeSubject.teacher;
                                }
                            }
                        }
                        
                        // Handle direct teacher ID if present (legacy support)
                        if (period.teacher && mongoose.Types.ObjectId.isValid(period.teacher)) {
                            const teacher = teachers[period.teacher.toString()];
                            if (teacher) {
                                timetable.weeklyTimetable[day][i].teacher = teacher;
                            }
                        }
                    }
                }
            }
        }
    }

    res.status(200).json({
        status: "success",
        data: timetable
    });
});

// Update a timetable
exports.updateTimetable = catchAsync(async (req, res, next) => {
    const { 
        weeklyTimetable, 
        status 
    } = req.body;


    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
        return next(new AppError("No timetable found with this ID", 404));
    }

    // If timetable doesn't have academicYear, get it from current settings
    let academicYear = timetable.academicYear;
    if (!academicYear) {
        const currentSettings = await Setting.findOne().populate('academicYear');
        
        if (!currentSettings || !currentSettings.academicYear) {
            return next(new AppError("Academic year not found. Please configure system settings", 400));
        }
        
        academicYear = currentSettings.academicYear._id;
        // Update the timetable with the academic year from settings
        timetable.academicYear = academicYear;
    }

    console.log({timetable})

    // If updating weekly timetable, validate subjects and teachers
    if (weeklyTimetable) {
        const gradeSubjects = await GradeSubject.find({
            academicYear: academicYear,
            grade: timetable.grade,
            gender: timetable.gender,
            section: timetable.section,
            Status: 'active'
        }).populate('subject teacher');

        // console.log({gradeSubjects})

        // Validate gradeSubjects and legacy fields
        const validGradeSubjects = gradeSubjects.map(gs => gs._id.toString());
        const validSubjects = gradeSubjects
            .filter(gs => gs.subject)
            .map(gs => gs.subject._id.toString());
        const validTeachers = gradeSubjects
            .filter(gs => gs.teacher)
            .map(gs => gs.teacher._id.toString());

        console.log({validGradeSubjects, validSubjects, validTeachers, gradeSubjects})


        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        // res.status(200).json({
        //     status: "success",
        //     data: weeklyTimetable
        // });

        // return false;
        
        for (const day of days) {
            if (weeklyTimetable[day]) {
                for (const period of weeklyTimetable[day]) {
                    if (!period.isBreak) {
                        // Validate gradeSubject if it's provided
                        if (period.gradeSubject && !validGradeSubjects.includes(period.gradeSubject.toString())) {
                            console.log({period})
                            return next(new AppError(`GradeSubject ${period.gradeSubject} is not valid for period ${period?.period}  on ${day}`, 400));
                        }
                        
                        // Legacy validation for backward compatibility
                        if (period.subject && !validSubjects.includes(period.subject.toString())) {
                            return next(new AppError(`Subject ${period.subject} is not assigned to this grade, gender, section combination`, 400));
                        }
                        if (period.teacher && !validTeachers.includes(period.teacher.toString())) {
                            return next(new AppError(`Teacher ${period.teacher} is not assigned to this grade, gender, section combination`, 400));
                        }
                    }
                }
            }
        }

        timetable.weeklyTimetable = weeklyTimetable;
    }

    if (status) timetable.status = status;
    
    timetable.updatedBy = req.user.id;

    await timetable.save();

    res.status(200).json({
        status: "success",
        data: timetable
    });
});

// Delete a timetable
exports.deleteTimetable = catchAsync(async (req, res, next) => {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
        return next(new AppError("No timetable found with this ID", 404));
    }

    await Timetable.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: "success",
        data: null
    });
});

// Get available subjects and teachers for a specific grade/gender/section/academic year
exports.getAvailableSubjectsAndTeachers = catchAsync(async (req, res, next) => {
    let { academicYear, grade, gender, section } = req.query;

    // If academicYear is not provided, get it from current settings
    if (!academicYear) {
        const Settings = require('../../models/Admin/Settings');
        const currentSettings = await Settings.findOne().populate('academicYear');
        
        if (!currentSettings || !currentSettings.academicYear) {
            return next(new AppError("Academic year not found. Please provide academicYear or configure system settings", 400));
        }
        
        academicYear = currentSettings.academicYear._id.toString();
    }

    if (!grade || !gender || !section) {
        return next(new AppError("Please provide grade, gender, and section", 400));
    }

    const gradeSubjects = await GradeSubject.find({
        academicYear,
        grade,
        gender,
        section,
        Status: 'active'
    }).populate({
        path: 'subject',
        select: 'subjectName'
    }).populate({
        path: 'teacher',
        select: 'employeeName employeeId'
    });

    console.log(gradeSubjects)

    if (gradeSubjects.length === 0) {
        return next(new AppError("No subjects found for this grade, gender, section and academic year combination", 404));
    }

   

    res.status(200).json({
        status: "success",
        data: {
            subjects: gradeSubjects,
            totalSubjects: gradeSubjects.length
        }
    });
});

// Get school timings for timetable creation
exports.getSchoolTimingsForTimetable = catchAsync(async (req, res, next) => {
    const { gradeId, gender } = req.query;
    
    if (!gradeId || !gender) {
        return next(new AppError("Please provide gradeId and gender", 400));
    }

    const setting = await Setting.findOne();
    
    if (!setting) {
        return next(new AppError("No school settings found", 404));
    }

    let timings = setting.schoolTimings.default;

    // Check for grade and gender specific override (highest priority)
    const gradeGenderOverride = setting.schoolTimings.gradeGenderOverrides.find(
        override => override.grade.toString() === gradeId && override.gender === gender
    );
    if (gradeGenderOverride) {
        timings = { ...timings, ...gradeGenderOverride };
    }

    // Check for grade specific override
    let gradeOverride = null;
    if (!gradeGenderOverride) {
        gradeOverride = setting.schoolTimings.gradeOverrides.find(
            override => override.grade.toString() === gradeId
        );
        if (gradeOverride) {
            timings = { ...timings, ...gradeOverride };
        }
    }

    // Check for gender specific override
    if (!gradeGenderOverride && !gradeOverride) {
        const genderOverride = setting.schoolTimings.genderOverrides.find(
            override => override.gender === gender
        );
        if (genderOverride) {
            timings = { ...timings, ...genderOverride };
        }
    }

    res.status(200).json({
        status: "success",
        data: {
            timings,
            periodDuration: timings.periodDuration,
            totalPeriods: timings.totalPeriods,
            breaks: timings.breaks || []
        }
    });
});

// Generate timetable template based on school timings
exports.generateTimetableTemplate = catchAsync(async (req, res, next) => {
    const { academicYear, grade, gender, section } = req.query;
    
    if (!academicYear || !grade || !gender || !section) {
        return next(new AppError("Please provide academicYear, grade, gender, and section", 400));
    }

    // Get school timings
    const setting = await Setting.findOne();
    if (!setting) {
        return next(new AppError("No school settings found", 404));
    }

    let timings = setting.schoolTimings.default;

    // Check for grade and gender specific overrides
    const gradeGenderOverride = setting.schoolTimings.gradeGenderOverrides.find(
        override => override.grade.toString() === grade && override.gender === gender
    );
    if (gradeGenderOverride) {
        timings = { ...timings, ...gradeGenderOverride };
    } else {
        const gradeOverride = setting.schoolTimings.gradeOverrides.find(
            override => override.grade.toString() === grade
        );
        if (gradeOverride) {
            timings = { ...timings, ...gradeOverride };
        }

        const genderOverride = setting.schoolTimings.genderOverrides.find(
            override => override.gender === gender
        );
        if (genderOverride) {
            timings = { ...timings, ...genderOverride };
        }
    }

    // Get available subjects and teachers
    const gradeSubjects = await GradeSubject.find({
        academicYear,
        grade,
        gender,
        section,
        Status: 'active'
    }).populate({
        path: 'subject',
        select: 'subjectName'
    }).populate({
        path: 'teacher',
        select: 'employeeName employeeId'
    });

    if (gradeSubjects.length === 0) {
        return next(new AppError("No subjects found for this grade, gender, section and academic year combination", 404));
    }

    // Generate time slots based on school timings
    const startTime = timings.startTime;
    const endTime = timings.endTime;
    const periodDuration = timings.periodDuration;
    const breaks = timings.breaks || [];

    // Helper function to add minutes to time
    const addMinutes = (time, minutes) => {
        const [hours, mins] = time.split(':').map(Number);
        const totalMinutes = hours * 60 + mins + minutes;
        const newHours = Math.floor(totalMinutes / 60);
        const newMins = totalMinutes % 60;
        return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
    };

    // Generate periods for a day
    const generateDayPeriods = () => {
        const periods = [];
        let currentTime = startTime;
        let periodNumber = 1;

        while (currentTime < endTime && periodNumber <= timings.totalPeriods) {
            const periodEndTime = addMinutes(currentTime, periodDuration);
            
            // Check if this period overlaps with any break
            let isBreakPeriod = false;
            let breakInfo = null;
            
            for (const breakItem of breaks) {
                if (currentTime >= breakItem.startTime && currentTime < breakItem.endTime) {
                    isBreakPeriod = true;
                    breakInfo = breakItem;
                    break;
                }
            }

            periods.push({
                period: periodNumber,
                startTime: currentTime,
                endTime: periodEndTime,
                duration: periodDuration,
                isBreak: isBreakPeriod,
                breakType: isBreakPeriod ? breakInfo?.name || 'break' : undefined,
                subject: null,
                teacher: null,
                room: ''
            });

            currentTime = periodEndTime;
            periodNumber++;
        }

        return periods;
    };

    // Generate template for all days
    const template = {
        monday: generateDayPeriods(),
        tuesday: generateDayPeriods(),
        wednesday: generateDayPeriods(),
        thursday: generateDayPeriods(),
        friday: generateDayPeriods(),
        saturday: generateDayPeriods(),
        sunday: generateDayPeriods()
    };

    res.status(200).json({
        status: "success",
        data: {
            template,
            availableSubjects: gradeSubjects.map(gs => ({
                gradeSubjectId: gs._id,
                subjectId: gs.subject?._id,
                subjectName: gs.subject?.subjectName,
                teacherId: gs.teacher?._id,
                teacherName: gs.teacher?.employeeName,
                employeeId: gs.teacher?.employeeId
            })),
            schoolTimings: timings
        }
    });
});

// Get timetable by grade, gender, section, academic year and term
exports.getTimetableByClass = catchAsync(async (req, res, next) => {
    let { academicYear, term, grade, gender, section } = req.query;

    // If academicYear is not provided, get it from current settings
    if (!academicYear) {
        const currentSettings = await Setting.findOne().populate('academicYear');
        
        if (!currentSettings || !currentSettings.academicYear) {
            return next(new AppError("Academic year not found. Please provide academicYear or configure system settings", 400));
        }
        
        academicYear = currentSettings.academicYear._id.toString();
    }

    if (!term || !grade || !gender || !section) {
        return next(new AppError("Please provide term, grade, gender, and section", 400));
    }

    const timetableDoc = await Timetable.findOne({
        academicYear,
        term,
        grade,
        gender,
        section
    })
    .populate('academicYear', 'academicYear')
    .populate('grade', 'gradeName')
    .populate('section', 'sectionName');

    if (!timetableDoc) {
        return next(new AppError("No timetable found for this class", 404));
    }

    // Convert to plain object for manipulation
    const timetable = timetableDoc.toObject();

    // Manually populate gradeSubject data for each day
    const mongoose = require('mongoose');
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
                        // Handle current frontend data structure where only subject IDs are stored
                        if (period.subject && mongoose.Types.ObjectId.isValid(period.subject)) {
                            // Populate the subject
                            const subject = await Subject.findById(period.subject).select('subjectName');
                            if (subject) {
                                timetable.weeklyTimetable[day][i].subject = subject;
                                
                                // Try to find the teacher through gradeSubject lookup
                                const gradeSubject = await GradeSubject.findOne({
                                    academicYear: timetable.academicYear,
                                    grade: timetable.grade,
                                    gender: timetable.gender,
                                    section: timetable.section,
                                    subject: period.subject,
                                    Status: 'active'
                                }).populate('teacher', 'employeeName employeeId');
                                
                                if (gradeSubject && gradeSubject.teacher) {
                                    timetable.weeklyTimetable[day][i].teacher = gradeSubject.teacher;
                                }
                            }
                        }
                        
                        // Handle direct teacher ID if present (legacy support)
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

    res.status(200).json({
        status: "success",
        data: timetable
    });
});
