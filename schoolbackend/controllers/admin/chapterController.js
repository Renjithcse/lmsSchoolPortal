const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const Chapter = require('../../models/LessonPlans/Chapter');
const PublishedChapter = require('../../models/LessonPlans/PublishedChapter');
const LessonPlan = require('../../models/LessonPlans/LessonPlan');
const GradeSubject = require('../../models/Admin/GradeSubject');
const Settings = require('../../models/Admin/Settings');

// Create a new chapter
exports.createChapter = catchAsync(async (req, res, next) => {
    const { 
        chapterName,
        description,
        academicYear, 
        grade, 
        subject,
        status = 'active'
    } = req.body;

    // Get academic year from settings if not provided
    let finalAcademicYear = academicYear;
    if (!finalAcademicYear) {
        const currentSettings = await Settings.findOne().populate('academicYear');
        if (!currentSettings) {
            return next(new AppError('System settings not configured', 500));
        }
        finalAcademicYear = currentSettings.academicYear?._id || currentSettings.academicYear;
    }

    // Validate required fields
    if (!chapterName || !description || !grade || !subject) {
        return next(new AppError("Please provide chapter name, description, grade, and subject", 400));
    }

    const chapter = await Chapter.create({
        chapterName,
        description,
        academicYear: finalAcademicYear,
        grade,
        subject,
        status,
        createdBy: req.user.id
    });

    // Populate the created chapter
    await chapter.populate([
        { path: 'academicYear', select: 'academicYear' },
        { path: 'grade', select: 'gradeName' },
        { path: 'subject', select: 'subjectName' },
        { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
        status: "success",
        data: chapter
    });
});

// Get all chapters with filters
exports.getAllChapters = catchAsync(async (req, res, next) => {
    const { 
        academicYear, 
        grade, 
        subject,
        status,
        search,
        page = 1,
        limit = 10
    } = req.query;

    // Get academic year from settings if not provided
    let finalAcademicYear = academicYear;
    if (!finalAcademicYear) {
        const currentSettings = await Settings.findOne().populate('academicYear');
        if (currentSettings && currentSettings.academicYear) {
            finalAcademicYear = currentSettings.academicYear?._id || currentSettings.academicYear;
        }
    }

    const query = {};
    
    if (finalAcademicYear) query.academicYear = finalAcademicYear;
    if (grade) query.grade = grade;
    if (subject) query.subject = subject;
    if (status) query.status = status;
    
    // Text search
    if (search) {
        query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const chapters = await Chapter.find(query)
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('subject', 'subjectName')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Chapter.countDocuments(query);

    // Get publish counts and lesson plan counts for all chapters using aggregation
    let publishCountMap = {};
    let lessonPlanCountMap = {};
    if (chapters.length > 0) {
        const chapterIds = chapters.map(chapter => chapter._id);
        
        // Get publish counts
        const publishCounts = await PublishedChapter.aggregate([
            {
                $match: {
                    chapter: { $in: chapterIds },
                    status: 'active'
                }
            },
            {
                $group: {
                    _id: '$chapter',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Create a map of chapter ID to publish count for quick lookup
        publishCounts.forEach(item => {
            publishCountMap[item._id.toString()] = item.count;
        });

        // Get lesson plan counts
        const lessonPlanCounts = await LessonPlan.aggregate([
            {
                $match: {
                    chapter: { $in: chapterIds }
                }
            },
            {
                $group: {
                    _id: '$chapter',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Create a map of chapter ID to lesson plan count for quick lookup
        lessonPlanCounts.forEach(item => {
            lessonPlanCountMap[item._id.toString()] = item.count;
        });
    }

    // Add counts to chapters
    const chaptersWithCounts = chapters.map(chapter => ({
        ...chapter.toObject(),
        publishCount: publishCountMap[chapter._id.toString()] || 0,
        lessonPlanCount: lessonPlanCountMap[chapter._id.toString()] || 0
    }));

    res.status(200).json({
        status: "success",
        results: chapters.length,
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        data: chaptersWithCounts
    });
});

// Get a specific chapter
exports.getChapter = catchAsync(async (req, res, next) => {
    const chapter = await Chapter.findById(req.params.id)
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('subject', 'subjectName')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

    if (!chapter) {
        return next(new AppError("No chapter found with this ID", 404));
    }

    // Get all published chapters for this chapter
    const publishedChapters = await PublishedChapter.find({
        chapter: req.params.id,
        status: 'active'
    })
        .populate('section', 'sectionName')
        .populate('publishedBy', 'name email')
        .sort({ publishedAt: -1 });

    // Get lesson plans for this chapter
    const lessonPlans = await LessonPlan.find({ chapter: req.params.id })
        .populate('createdBy', 'name email')
        .populate('createdByTeacher', 'employeeName employeeId')
        .sort({ order: 1, createdAt: 1 });

    res.status(200).json({
        status: "success",
        data: {
            ...chapter.toObject(),
            publishCount: publishedChapters.length,
            publishedClasses: publishedChapters.map(pc => ({
                _id: pc._id,
                gender: pc.gender,
                section: pc.section,
                publishedAt: pc.publishedAt,
                publishedBy: pc.publishedBy
            })),
            lessonPlans: lessonPlans
        }
    });
});

// Update a chapter
exports.updateChapter = catchAsync(async (req, res, next) => {
    const { 
        chapterName,
        description,
        status
    } = req.body;

    const chapter = await Chapter.findById(req.params.id);

    if (!chapter) {
        return next(new AppError("No chapter found with this ID", 404));
    }

    // Update fields
    if (chapterName) chapter.chapterName = chapterName;
    if (description) chapter.description = description;
    if (status) chapter.status = status;
    
    chapter.updatedBy = req.user.id;

    await chapter.save();

    // Populate the updated chapter
    await chapter.populate([
        { path: 'academicYear', select: 'academicYear' },
        { path: 'grade', select: 'gradeName' },
        { path: 'subject', select: 'subjectName' },
        { path: 'createdBy', select: 'name email' },
        { path: 'updatedBy', select: 'name email' }
    ]);

    res.status(200).json({
        status: "success",
        data: chapter
    });
});

// Delete a chapter
exports.deleteChapter = catchAsync(async (req, res, next) => {
    const chapter = await Chapter.findById(req.params.id);

    if (!chapter) {
        return next(new AppError("No chapter found with this ID", 404));
    }

    // Check if chapter has published classes
    const publishedCount = await PublishedChapter.countDocuments({
        chapter: req.params.id,
        status: 'active'
    });

    if (publishedCount > 0) {
        return next(new AppError("Cannot delete chapter with active publications. Please archive publications first.", 400));
    }

    // Delete associated lesson plans
    await LessonPlan.deleteMany({ chapter: req.params.id });

    await Chapter.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: "success",
        data: null
    });
});


// Get available subjects for chapters based on grade
exports.getAvailableSubjects = catchAsync(async (req, res, next) => {
    const { grade } = req.query;

    let academicYear;

    if(!req?.query?.academicYear){
        const currentAcademicYear = await Settings.findOne().populate('academicYear');

        if(!currentAcademicYear){
            return next(new AppError("No current academic year found in settings", 404));
        }

        academicYear = currentAcademicYear?.academicYear
    }
    else{
        academicYear = req?.query?.academicYear
    }

    if (!academicYear || !grade) {
        return next(new AppError("Please provide academicYear and grade", 400));
    }

    // Get unique subjects for this grade (across all genders and sections)
    const gradeSubjects = await GradeSubject.find({
        academicYear,
        grade,
        Status: 'active'
    }).distinct('subject');

    if (gradeSubjects.length === 0) {
        return next(new AppError("No subjects found for this grade", 404));
    }

    // Get subject details
    const Subject = require('../../models/Admin/Subject');
    const subjects = await Subject.find({ _id: { $in: gradeSubjects } })
        .select('_id subjectName')
        .lean();

    res.status(200).json({
        status: "success",
        data: {
            subjects: subjects.map(sub => ({
                subjectId: sub._id,
                subjectName: sub.subjectName
            }))
        }
    });
});

// Publish chapter to multiple sections
exports.publishChapter = catchAsync(async (req, res, next) => {
    const chapterId = req.params.chapterId || req.params.id;
    const { gender, sections } = req.body; // sections is an array of section IDs

    if (!gender || !sections || !Array.isArray(sections) || sections.length === 0) {
        return next(new AppError("Please provide gender and at least one section", 400));
    }

    // Get the chapter
    const chapter = await Chapter.findById(chapterId)
        .populate('academicYear')
        .populate('grade')
        .populate('subject');

    if (!chapter) {
        return next(new AppError("Chapter not found", 404));
    }

    // Verify teacher has permission for these sections
    const Teacher = require('../../models/users/Teacher');
    const SubjectPermissions = require('../../models/Admin/SubjectPermissions');
    const Section = require('../../models/Admin/Section');

    let teacherId = req.teacherId;
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }

    if (teacherId) {
        // Check if teacher has permission for these sections
        const academicYearId = chapter.academicYear._id || chapter.academicYear;
        const subjectPermissions = await SubjectPermissions.find({
            academicYear: academicYearId,
            teacher: teacherId,
            grade: chapter.grade._id || chapter.grade,
            gender: gender
        }).select('section').lean();

        const gradeSubjects = await GradeSubject.find({
            academicYear: academicYearId,
            teacher: teacherId,
            grade: chapter.grade._id || chapter.grade,
            gender: gender,
            subject: chapter.subject._id || chapter.subject,
            Status: 'active'
        }).select('section').lean();

        const allowedSectionIds = new Set();
        if (subjectPermissions.length > 0) {
            subjectPermissions.forEach(sp => {
                const sectionId = sp.section?._id || sp.section;
                if (sectionId) allowedSectionIds.add(sectionId.toString());
            });
        }
        if (gradeSubjects.length > 0) {
            gradeSubjects.forEach(gs => {
                const sectionId = gs.section?._id || gs.section;
                if (sectionId) allowedSectionIds.add(sectionId.toString());
            });
        }

        // Filter sections to only those teacher has permission for
        const validSections = sections.filter(secId => allowedSectionIds.has(secId.toString()));
        if (validSections.length === 0) {
            return next(new AppError("You don't have permission to publish to any of the selected sections", 403));
        }
    }

    // Create published chapters for each section
    const publishedChapters = [];
    const errors = [];

    for (const sectionId of sections) {
        try {
            // Check if already published to this section
            const existingPublished = await PublishedChapter.findOne({
                chapter: chapterId,
                gender: gender,
                section: sectionId,
                status: 'active'
            });

            if (existingPublished) {
                errors.push(`Chapter already published to this section`);
                continue;
            }

            // Verify subject is assigned to this section
            const gradeSubject = await GradeSubject.findOne({
                academicYear: chapter.academicYear._id || chapter.academicYear,
                grade: chapter.grade._id || chapter.grade,
                gender: gender,
                section: sectionId,
                subject: chapter.subject._id || chapter.subject,
                Status: 'active'
            });

            if (!gradeSubject) {
                errors.push(`Subject not assigned to section ${sectionId}`);
                continue;
            }

            // Create published chapter record
            const publishedChapter = await PublishedChapter.create({
                chapter: chapterId,
                academicYear: chapter.academicYear._id || chapter.academicYear,
                grade: chapter.grade._id || chapter.grade,
                gender: gender,
                section: sectionId,
                subject: chapter.subject._id || chapter.subject,
                publishedBy: req.user.id,
                status: 'active'
            });

            await publishedChapter.populate([
                { path: 'chapter' },
                { path: 'academicYear', select: 'academicYear' },
                { path: 'grade', select: 'gradeName' },
                { path: 'section', select: 'sectionName' },
                { path: 'subject', select: 'subjectName' },
                { path: 'publishedBy', select: 'name email' }
            ]);

            publishedChapters.push(publishedChapter);
        } catch (error) {
            if (error.code === 11000) {
                errors.push(`Chapter already published to this section`);
            } else {
                errors.push(`Error publishing to section ${sectionId}: ${error.message}`);
            }
        }
    }

    if (publishedChapters.length === 0) {
        return next(new AppError(`Failed to publish chapter: ${errors.join(', ')}`, 400));
    }

    res.status(201).json({
        status: "success",
        data: {
            publishedChapters,
            publishedCount: publishedChapters.length,
            totalSections: sections.length,
            errors: errors.length > 0 ? errors : undefined
        }
    });
});

// Get available sections for publishing (based on teacher permissions)
exports.getAvailablePublishSections = catchAsync(async (req, res, next) => {
    const { grade, gender, subject, chapterId } = req.query;

    if (!grade || !gender) {
        return next(new AppError("Grade and gender are required", 400));
    }

    const Teacher = require('../../models/users/Teacher');
    const SubjectPermissions = require('../../models/Admin/SubjectPermissions');
    const Section = require('../../models/Admin/Section');
    const Settings = require('../../models/Admin/Settings');

    // Get current academic year
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError("System settings not configured", 500));
    }
    const academicYearId = currentSettings.academicYear._id || currentSettings.academicYear;

    // Get already published sections for this chapter (if chapterId is provided)
    let alreadyPublishedSectionIds = [];
    if (chapterId) {
        const publishedChapters = await PublishedChapter.find({
            chapter: chapterId,
            gender: gender,
            status: 'active'
        }).select('section').lean();

        alreadyPublishedSectionIds = publishedChapters
            .map(pc => pc.section?._id || pc.section)
            .filter(id => id)
            .map(id => id.toString());
    }

    // Subject is required to verify it's registered to sections
    if (!subject) {
        return next(new AppError("Subject is required to verify section registration", 400));
    }

    // Get teacher ID (needed for non-admin users)
    let teacherId = req.teacherId;
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }

    // Get available sections - must verify subject is registered to section via GradeSubject
    let availableSections = [];

    // Build query to find GradeSubject where subject is registered
    const gradeSubjectQuery = {
        academicYear: academicYearId,
        grade: grade,
        gender: gender,
        subject: subject,
        Status: 'active'
    };

    // If user is admin, get all sections where subject is registered
    if (req.user && req.user.role === 'admin') {
        const gradeSubjects = await GradeSubject.find(gradeSubjectQuery)
            .select('section')
            .lean();

        if (gradeSubjects.length > 0) {
            const sectionIds = gradeSubjects
                .map(gs => gs.section?._id || gs.section)
                .filter(id => id)
                .map(id => id.toString());
            availableSections = [...new Set(sectionIds)];
        }
    } else {
        // For non-admin users, check teacher permissions AND subject registration
        if (!teacherId) {
            return next(new AppError("Teacher ID not found", 401));
        }

        // Check SubjectPermissions first
        const subjectPermissions = await SubjectPermissions.find({
            academicYear: academicYearId,
            teacher: teacherId,
            grade: grade,
            gender: gender
        }).select('section').lean();

        let permissionSectionIds = [];
        if (subjectPermissions.length > 0) {
            permissionSectionIds = subjectPermissions
                .map(sp => sp.section?._id || sp.section)
                .filter(id => id)
                .map(id => id.toString());
        }

        // Get GradeSubject where subject is registered AND teacher has permission
        // Option 1: GradeSubject where teacher is assigned
        gradeSubjectQuery.teacher = teacherId;
        const gradeSubjectsWithTeacher = await GradeSubject.find(gradeSubjectQuery)
            .select('section')
            .lean();

        if (gradeSubjectsWithTeacher.length > 0) {
            const sectionIds = gradeSubjectsWithTeacher
                .map(gs => gs.section?._id || gs.section)
                .filter(id => id)
                .map(id => id.toString());
            availableSections = [...new Set(sectionIds)];
        }

        // Option 2: GradeSubject for sections from SubjectPermissions (where subject is registered)
        if (permissionSectionIds.length > 0) {
            delete gradeSubjectQuery.teacher; // Remove teacher filter for this query
            const gradeSubjectsFromPermissions = await GradeSubject.find({
                ...gradeSubjectQuery,
                section: { $in: permissionSectionIds }
            }).select('section').lean();

            if (gradeSubjectsFromPermissions.length > 0) {
                const sectionIds = gradeSubjectsFromPermissions
                    .map(gs => gs.section?._id || gs.section)
                    .filter(id => id)
                    .map(id => id.toString());
                availableSections = [...new Set([...availableSections, ...sectionIds])];
            }
        }
    }

    // Filter out already published sections
    if (alreadyPublishedSectionIds.length > 0) {
        availableSections = availableSections.filter(
            sectionId => !alreadyPublishedSectionIds.includes(sectionId)
        );
    }

    // Get section details
    const sections = await Section.find({ _id: { $in: availableSections } })
        .select('_id sectionName')
        .lean();

    res.status(200).json({
        status: "success",
        data: sections
    });
});
