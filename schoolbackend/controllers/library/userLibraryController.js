const BookIssue = require('../../models/Library/BookIssue');
const Book = require('../../models/Library/Book');
const Student = require('../../models/users/Student');
const Teacher = require('../../models/users/Teacher');
const Settings = require('../../models/Admin/Settings');
const catchAsync = require('../../utils/catchAsync');

// Get current user's issued books
exports.getMyIssuedBooks = catchAsync(async (req, res) => {
    const userRole = req.user.role;

    let userType;
    let actualUserId;

    if (userRole === 'student') {
        userType = 'Student';
        // Get the student ID from the request (set by middleware)
        actualUserId = req.studentId;
        if (!actualUserId) {
            // Fallback: find student by userId
            const student = await Student.findOne({ userId: req.user.id });
            actualUserId = student?._id;
        }
    } else if (userRole === 'teacher') {
        userType = 'Teacher';
        // Get the teacher ID from the request (set by middleware)
        actualUserId = req.teacherId;
        if (!actualUserId) {
            // Fallback: find teacher by userId
            const teacher = await Teacher.findOne({ userId: req.user.id });
            actualUserId = teacher?._id;
        }
    } else {
        return res.status(403).json({ message: 'Access denied. Only students and teachers can access this feature.' });
    }

    if (!actualUserId) {
        return res.status(404).json({ message: 'Student/Teacher profile not found' });
    }

    const bookIssues = await BookIssue.find({
        issuedTo: actualUserId,
        issuedToModel: userType,
        status: { $in: ['issued', 'overdue'] }
    })
        .populate({
            path: 'book',
            populate: {
                path: 'bookCatalog',
                select: 'title author isbn category subject'
            },
            select: 'copyNumber coverImage'
        })
        .populate('issuedBy', 'name email')
        .sort({ issueDate: -1 });

    // Calculate additional information for each book
    const enhancedBookIssues = bookIssues.map(issue => {
        const bookIssue = issue.toObject();
        const today = new Date();
        const dueDate = new Date(issue.dueDate);

        // Calculate days overdue
        if (dueDate < today && issue.status === 'issued') {
            const diffTime = Math.abs(today - dueDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            bookIssue.daysOverdue = diffDays;
            bookIssue.isOverdue = true;
        } else {
            bookIssue.daysOverdue = 0;
            bookIssue.isOverdue = false;
        }

        // Calculate days remaining
        if (dueDate > today) {
            const diffTime = Math.abs(dueDate - today);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            bookIssue.daysRemaining = diffDays;
        } else {
            bookIssue.daysRemaining = 0;
        }

        return bookIssue;
    });

    res.status(200).json({
        status: 'success',
        data: enhancedBookIssues
    });
});

// Get current user's library history
exports.getMyLibraryHistory = catchAsync(async (req, res) => {
    const userRole = req.user.role;

    let userType;
    let actualUserId;

    if (userRole === 'student') {
        userType = 'Student';
        // Get the student ID from the request (set by middleware)
        actualUserId = req.studentId;
        if (!actualUserId) {
            // Fallback: find student by userId
            const student = await Student.findOne({ userId: req.user.id });
            actualUserId = student?._id;
        }
    } else if (userRole === 'teacher') {
        userType = 'Teacher';
        // Get the teacher ID from the request (set by middleware)
        actualUserId = req.teacherId;
        if (!actualUserId) {
            // Fallback: find teacher by userId
            const teacher = await Teacher.findOne({ userId: req.user.id });
            actualUserId = teacher?._id;
        }
    } else {
        return res.status(403).json({ message: 'Access denied. Only students and teachers can access this feature.' });
    }

    if (!actualUserId) {
        return res.status(404).json({ message: 'Student/Teacher profile not found' });
    }

    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {
        issuedTo: actualUserId,
        issuedToModel: userType
    };

    if (status) {
        query.status = status;
    }

    const bookIssues = await BookIssue.find(query)
        .populate({
            path: 'book',
            populate: {
                path: 'bookCatalog',
                select: 'title author isbn category subject'
            },
            select: 'copyNumber coverImage'
        })
        .populate('issuedBy', 'name email')
        .populate('returnedTo', 'name email')
        .sort({ issueDate: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await BookIssue.countDocuments(query);
    


    // Calculate additional information for each book
    const enhancedBookIssues = bookIssues.map(issue => {
        const bookIssue = issue.toObject();
        const today = new Date();
        const dueDate = new Date(issue.dueDate);

        // Calculate days overdue for returned books
        if (issue.status === 'returned' && dueDate < new Date(issue.returnDate)) {
            const returnDate = new Date(issue.returnDate);
            const diffTime = Math.abs(returnDate - dueDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            bookIssue.daysOverdue = diffDays;
        }

        return bookIssue;
    });

    res.status(200).json({
        status: 'success',
        data: enhancedBookIssues,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: parseInt(limit)
        }
    });
});

// Get current user's library statistics
exports.getMyLibraryStats = catchAsync(async (req, res) => {
    const userRole = req.user.role;

    let userType;
    let actualUserId;

    if (userRole === 'student') {
        userType = 'Student';
        // Get the student ID from the request (set by middleware)
        actualUserId = req.studentId;
        if (!actualUserId) {
            // Fallback: find student by userId
            const student = await Student.findOne({ userId: req.user.id });
            actualUserId = student?._id;
        }
    } else if (userRole === 'teacher') {
        userType = 'Teacher';
        // Get the teacher ID from the request (set by middleware)
        actualUserId = req.teacherId;
        if (!actualUserId) {
            // Fallback: find teacher by userId
            const teacher = await Teacher.findOne({ userId: req.user.id });
            actualUserId = teacher?._id;
        }
    } else {
        return res.status(403).json({ message: 'Access denied. Only students and teachers can access this feature.' });
    }

    if (!actualUserId) {
        return res.status(404).json({ message: 'Student/Teacher profile not found' });
    }

    // Get library settings
    const settings = await Settings.findOne().sort({ createdAt: -1 });
    const maxBooks = userRole === 'student'
        ? (settings?.librarySettings?.maxBooksForStudent || 3)
        : (settings?.librarySettings?.maxBooksForTeacher || 5);

    // Get current issued books count
    const currentIssues = await BookIssue.countDocuments({
        issuedTo: actualUserId,
        issuedToModel: userType,
        status: { $in: ['issued', 'overdue'] }
    });

    // Get total books borrowed
    const totalBorrowed = await BookIssue.countDocuments({
        issuedTo: actualUserId,
        issuedToModel: userType
    });

    // Get overdue books count
    const overdueBooks = await BookIssue.countDocuments({
        issuedTo: actualUserId,
        issuedToModel: userType,
        status: { $in: ['issued', 'overdue'] },
        dueDate: { $lt: new Date() }
    });

    // Get total fines
    const totalFines = await BookIssue.aggregate([
        {
            $match: {
                issuedTo: actualUserId,
                issuedToModel: userType,
                fineAmount: { $gt: 0 }
            }
        },
        { $group: { _id: null, total: { $sum: '$fineAmount' } } }
    ]);

    // Get paid fines
    const paidFines = await BookIssue.aggregate([
        {
            $match: {
                issuedTo: actualUserId,
                issuedToModel: userType,
                finePaid: true
            }
        },
        { $group: { _id: null, total: { $sum: '$fineAmount' } } }
    ]);

    // Get recent activity (last 5 books)
    const recentActivity = await BookIssue.find({
        issuedTo: actualUserId,
        issuedToModel: userType
    })
        .populate({
            path: 'book',
            populate: {
                path: 'bookCatalog',
                select: 'title author isbn'
            }
        })
        .sort({ issueDate: -1 })
        .limit(5);

    const stats = {
        maxBooksAllowed: maxBooks,
        currentIssues,
        booksRemaining: maxBooks - currentIssues,
        totalBorrowed,
        overdueBooks,
        totalFines: totalFines[0]?.total || 0,
        paidFines: paidFines[0]?.total || 0,
        pendingFines: (totalFines[0]?.total || 0) - (paidFines[0]?.total || 0),
        recentActivity
    };

    res.status(200).json({
        status: 'success',
        data: stats
    });
});

// Get available books for current user
exports.getAvailableBooks = catchAsync(async (req, res) => {
    const { page = 1, limit = 12, search, category, subject } = req.query;
    const skip = (page - 1) * limit;

    // Import BookCatalog model
    const BookCatalog = require('../../models/Library/BookCatalog');

    // Build query for available book catalogs
    let query = {
        isActive: true
    };

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { author: { $regex: search, $options: 'i' } },
            { isbn: { $regex: search, $options: 'i' } }
        ];
    }

    if (category) {
        query.category = category;
    }

    if (subject) {
        query.subject = subject;
    }

    // Get book catalogs that have available copies
    const bookCatalogs = await BookCatalog.find(query)
        .populate('category', 'name description')
        .sort({ title: 1 })
        .skip(skip)
        .limit(parseInt(limit));

    // For each catalog, check if it has available copies
    const availableBooks = [];
    for (const catalog of bookCatalogs) {
        const availableCopies = await Book.countDocuments({
            bookCatalog: catalog._id,
            status: 'available',
            isActive: true
        });

        if (availableCopies > 0) {
            // Get one available copy for location info
            const sampleCopy = await Book.findOne({
                bookCatalog: catalog._id,
                status: 'available',
                isActive: true
            }).populate('rack', 'rackNumber description');

            availableBooks.push({
                ...catalog.toObject(),
                availableCopies,
                rack: sampleCopy?.rack,
                coverImage: sampleCopy?.coverImage
            });
        }
    }

    const total = availableBooks.length;

    // Get unique categories and subjects for filters
    const categories = await BookCatalog.distinct('category', { isActive: true });
    const subjects = await BookCatalog.distinct('subject', { isActive: true });

    res.status(200).json({
        status: 'success',
        data: availableBooks,
        filters: {
            categories,
            subjects
        },
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: parseInt(limit)
        }
    });
});

// Request book renewal
exports.requestRenewal = catchAsync(async (req, res) => {
    const { bookIssueId } = req.params;
    const userRole = req.user.role;

    let userType;
    let actualUserId;

    if (userRole === 'student') {
        userType = 'Student';
        // Get the student ID from the request (set by middleware)
        actualUserId = req.studentId;
        if (!actualUserId) {
            // Fallback: find student by userId
            const student = await Student.findOne({ userId: req.user.id });
            actualUserId = student?._id;
        }
    } else if (userRole === 'teacher') {
        userType = 'Teacher';
        // Get the teacher ID from the request (set by middleware)
        actualUserId = req.teacherId;
        if (!actualUserId) {
            // Fallback: find teacher by userId
            const teacher = await Teacher.findOne({ userId: req.user.id });
            actualUserId = teacher?._id;
        }
    } else {
        return res.status(403).json({ message: 'Access denied. Only students and teachers can access this feature.' });
    }

    if (!actualUserId) {
        return res.status(404).json({ message: 'Student/Teacher profile not found' });
    }

    // Find the book issue
    const bookIssue = await BookIssue.findOne({
        _id: bookIssueId,
        issuedTo: actualUserId,
        issuedToModel: userType,
        status: { $in: ['issued', 'overdue'] }
    });

    if (!bookIssue) {
        return res.status(404).json({ message: 'Book issue not found or not eligible for renewal' });
    }

    // Get library settings
    const settings = await Settings.findOne().sort({ createdAt: -1 });
    const maxRenewals = settings?.librarySettings?.maxRenewals || 2;

    if (bookIssue.renewalCount >= maxRenewals) {
        return res.status(400).json({
            message: `Maximum renewals (${maxRenewals}) already reached for this book`
        });
    }

    // Check if book is overdue
    if (new Date() > new Date(bookIssue.dueDate)) {
        return res.status(400).json({
            message: 'Cannot renew overdue books. Please return the book and pay any fines.'
        });
    }

    // Calculate new due date
    const issueDuration = settings?.librarySettings?.bookIssueDuration || 14;
    const newDueDate = new Date(bookIssue.dueDate);
    newDueDate.setDate(newDueDate.getDate() + issueDuration);

    // Update book issue
    bookIssue.dueDate = newDueDate;
    bookIssue.renewalCount += 1;
    bookIssue.lastRenewalDate = new Date();
    await bookIssue.save();

    res.status(200).json({
        status: 'success',
        message: 'Book renewed successfully',
        data: {
            newDueDate,
            renewalCount: bookIssue.renewalCount,
            maxRenewals
        }
    });
});
