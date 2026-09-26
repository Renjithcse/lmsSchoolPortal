const Information = require('../../models/Information/Information');
const Student = require('../../models/users/Student');
const AcademicStudent = require('../../models/users/AcademicStudent');
const Settings = require('../../models/Admin/Settings');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const APIFeatures = require('../../utils/apiFeatures');
const path = require('path');
const fs = require('fs').promises;

// Build user object for permission checking using current academic year and placement (like subject notes)
const buildUserForCheck = async (student) => {
    const currentSettings = await Settings.findOne().populate('academicYear');
    const academicYearId = currentSettings?.academicYear?._id;
    const currentAcademic = academicYearId
        ? await AcademicStudent.findOne({
              studentId: student._id,
              academicYear: academicYearId,
              status: 'active'
          })
        : null;
    if (currentAcademic) {
        return {
            role: 'student',
            academicYear: academicYearId,
            grade: currentAcademic.grade,
            gender: currentAcademic.gender || 'male',
            section: currentAcademic.section
        };
    }
    return {
        role: 'student',
        academicYear: student.academicYear,
        grade: student.grade,
        gender: student.gender || 'male',
        section: student.section
    };
};

// Helper function to filter accessible information
const filterAccessibleInformation = async (allInformation, userForCheck) => {
    const accessibleInformation = [];
    for (const info of allInformation) {
        const canView = await info.canUserView(userForCheck);
        if (canView) {
            accessibleInformation.push(info);
        }
    }
    return accessibleInformation;
};

// Get all information visible to the student
exports.getAllStudentInformation = catchAsync(async (req, res, next) => {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
        return next(new AppError('Student profile not found', 404));
    }

    const userForCheck = await buildUserForCheck(student);

    // Get all published information
    const allInformation = await Information.find({ 
        status: 'Published',
        $or: [
            { expiryDate: null },
            { expiryDate: { $gt: new Date() } }
        ]
    }).populate('createdBy', 'name email').sort({ publishedAt: -1 });

    // Filter information based on targeting rules
    const accessibleInformation = await filterAccessibleInformation(allInformation, userForCheck);

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

// Get information by category for students
exports.getStudentInformationByCategory = catchAsync(async (req, res, next) => {
    const { category } = req.params;
    
    const validCategories = ['Information Desk', 'Help Desk', 'General Information'];
    if (!validCategories.includes(category)) {
        return next(new AppError('Invalid category', 400));
    }

    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
        return next(new AppError('Student profile not found', 404));
    }

    const userForCheck = await buildUserForCheck(student);

    // Get all published information for the category
    const allInformation = await Information.find({ 
        category,
        status: 'Published',
        $or: [
            { expiryDate: null },
            { expiryDate: { $gt: new Date() } }
        ]
    }).populate('createdBy', 'name email').sort({ publishedAt: -1 });

    // Filter information based on targeting rules
    const accessibleInformation = await filterAccessibleInformation(allInformation, userForCheck);

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

// Get single information item for student
exports.getStudentInformation = catchAsync(async (req, res, next) => {
    const information = await Information.findById(req.params.id)
        .populate('createdBy', 'name email');

    if (!information) {
        return next(new AppError('Information not found', 404));
    }

    // Get student details
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
        return next(new AppError('Student profile not found', 404));
    }

    const userForCheck = await buildUserForCheck(student);

    // Check if student can view this information
    const canView = await information.canUserView(userForCheck);
    if (!canView) {
        return next(new AppError('You do not have permission to view this information', 403));
    }

    // Track view
    const existingView = information.viewedBy.find(
        view => view.userId.toString() === req.user.id && view.userType === 'Student'
    );

    if (!existingView) {
        information.viewedBy.push({
            userId: req.user.id,
            userType: 'Student',
            viewedAt: new Date()
        });
        information.viewCount += 1;
        await information.save();
    }

    res.status(200).json({
        status: 'success',
        data: {
            information
        }
    });
});

// Download attachment
exports.downloadAttachment = catchAsync(async (req, res, next) => {
    const { id, attachmentId } = req.params;
    
    const information = await Information.findById(id);
    if (!information) {
        return next(new AppError('Information not found', 404));
    }

    // Get student details
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
        return next(new AppError('Student profile not found', 404));
    }

    const userForCheck = await buildUserForCheck(student);

    // Check if student can view this information
    const canViewFile = await information.canUserView(userForCheck);
    if (!canViewFile) {
        return next(new AppError('You do not have permission to access this information', 403));
    }

    // Find the attachment
    const attachment = information.attachments.find(
        att => att._id.toString() === attachmentId
    );

    if (!attachment) {
        return next(new AppError('Attachment not found', 404));
    }

    // Check if file exists
    try {
        await fs.access(attachment.filePath);
    } catch (error) {
        return next(new AppError('File not found on server', 404));
    }

    // Set appropriate headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.setHeader('Content-Type', attachment.mimeType);

    // Stream the file
    res.sendFile(path.resolve(attachment.filePath));
});

// Get information categories with counts for student
exports.getStudentInformationCategories = catchAsync(async (req, res, next) => {
    // Get student details
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
        return next(new AppError('Student profile not found', 404));
    }

    const userForCheck = await buildUserForCheck(student);

    const categories = ['Information Desk', 'Help Desk', 'General Information'];
    const categoriesWithCounts = [];

    for (const category of categories) {
        // Get all published information for the category
        const allInformation = await Information.find({ 
            category,
            status: 'Published',
            $or: [
                { expiryDate: null },
                { expiryDate: { $gt: new Date() } }
            ]
        });

        // Filter information based on targeting rules
        const accessibleInformation = await filterAccessibleInformation(allInformation, userForCheck);

        categoriesWithCounts.push({
            category,
            count: accessibleInformation.length,
            icon: getCategoryIcon(category),
            description: getCategoryDescription(category)
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            categories: categoriesWithCounts
        }
    });
});

// Get recent information for student dashboard
exports.getRecentStudentInformation = catchAsync(async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 5;

    // Get student details
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
        return next(new AppError('Student profile not found', 404));
    }

    const userForCheck = await buildUserForCheck(student);

    // Get recent published information
    const allInformation = await Information.find({ 
        status: 'Published',
        $or: [
            { expiryDate: null },
            { expiryDate: { $gt: new Date() } }
        ]
    }).populate('createdBy', 'name email')
      .sort({ publishedAt: -1 })
      .limit(limit * 3); // Get more to account for filtering

    // Filter information based on targeting rules
    const allAccessibleInformation = await filterAccessibleInformation(allInformation, userForCheck);
    const accessibleInformation = allAccessibleInformation.slice(0, limit);

    res.status(200).json({
        status: 'success',
        results: accessibleInformation.length,
        data: {
            information: accessibleInformation
        }
    });
});

// Get unread information count for student
exports.getUnreadInformationCount = catchAsync(async (req, res, next) => {
    // Get student details
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
        return next(new AppError('Student profile not found', 404));
    }

    const userForCheck = await buildUserForCheck(student);

    // Get all published information
    const allInformation = await Information.find({ 
        status: 'Published',
        $or: [
            { expiryDate: null },
            { expiryDate: { $gt: new Date() } }
        ]
    });

    // Filter information based on targeting rules
    const accessibleInformation = await filterAccessibleInformation(allInformation, userForCheck);

    // Count unread information
    const unreadCount = accessibleInformation.filter(info => {
        const hasViewed = info.viewedBy.some(
            view => view.userId.toString() === req.user.id && view.userType === 'Student'
        );
        return !hasViewed;
    }).length;

    res.status(200).json({
        status: 'success',
        data: {
            unreadCount,
            totalCount: accessibleInformation.length
        }
    });
});

// Search information for students
exports.searchStudentInformation = catchAsync(async (req, res, next) => {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
        return next(new AppError('Search query must be at least 2 characters long', 400));
    }

    // Get student details
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
        return next(new AppError('Student profile not found', 404));
    }

    const userForCheck = await buildUserForCheck(student);

    // Search in title, description, and tags
    const searchRegex = new RegExp(q.trim(), 'i');
    const allInformation = await Information.find({ 
        status: 'Published',
        $or: [
            { expiryDate: null },
            { expiryDate: { $gt: new Date() } }
        ],
        $and: [
            {
                $or: [
                    { title: searchRegex },
                    { description: searchRegex },
                    { tags: { $in: [searchRegex] } }
                ]
            }
        ]
    }).populate('createdBy', 'name email').sort({ publishedAt: -1 });

    // Filter information based on targeting rules
    const accessibleInformation = await filterAccessibleInformation(allInformation, userForCheck);

    res.status(200).json({
        status: 'success',
        results: accessibleInformation.length,
        data: {
            information: accessibleInformation,
            searchQuery: q
        }
    });
});

// Helper functions
function getCategoryIcon(category) {
    const icons = {
        'Information Desk': 'info',
        'Help Desk': 'help',
        'General Information': 'announcement'
    };
    return icons[category] || 'info';
}

function getCategoryDescription(category) {
    const descriptions = {
        'Information Desk': 'Important announcements and institutional information',
        'Help Desk': 'Support and assistance resources',
        'General Information': 'General notices and updates'
    };
    return descriptions[category] || '';
}
