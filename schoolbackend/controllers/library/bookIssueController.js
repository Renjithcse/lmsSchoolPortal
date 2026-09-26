const mongoose = require('mongoose');
const BookIssue = require('../../models/Library/BookIssue');
const Book = require('../../models/Library/Book');
const Settings = require('../../models/Admin/Settings');
const Student = require('../../models/users/Student');
const Teacher = require('../../models/users/Teacher');
const catchAsync = require('../../utils/catchAsync');

// Issue a book
exports.issueBook = catchAsync(async (req, res) => {
    const { bookId, issuedTo, issuedToModel, dueDate, issueNotes } = req.body;
    const issuedBy = req.user.id;
    
    // Validate book exists and is available
    const book = await Book.findById(bookId);
    if (!book) {
        return res.status(404).json({ message: 'Book not found' });
    }
    
    if (book.status !== 'available') {
        return res.status(400).json({ 
            message: `Book is not available for issue. Current status: ${book.status}` 
        });
    }
    
    // Validate issuedTo exists
    let user;
    if (issuedToModel === 'Student') {
        user = await Student.findOne({ studentID: issuedTo });
        if (!user) {
            return res.status(404).json({ message: 'Student not found' });
        }
    } else if (issuedToModel === 'Teacher') {
        user = await Teacher.findOne({ employeeId: issuedTo });
        if (!user) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
    } else {
        return res.status(400).json({ message: 'Invalid user type' });
    }
    
    // Get library settings
    const settings = await Settings.findOne().sort({ createdAt: -1 });
    if (!settings || !settings.librarySettings) {
        return res.status(500).json({ message: 'Library settings not configured' });
    }
    
    // Check if user has reached book limit
    const currentIssues = await BookIssue.countDocuments({
        issuedTo: user._id,
        issuedToModel,
        status: { $in: ['issued', 'overdue'] }
    });
    
    const maxBooks = issuedToModel === 'Student' 
        ? settings.librarySettings.maxBooksForStudent 
        : settings.librarySettings.maxBooksForTeacher;
    
    if (currentIssues >= maxBooks) {
        return res.status(400).json({ 
            message: `${issuedToModel} has already reached the maximum limit of ${maxBooks} books` 
        });
    }
    
    // Check if user already has this book
    const existingIssue = await BookIssue.findOne({
        book: bookId,
        issuedTo: user._id,
        issuedToModel,
        status: { $in: ['issued', 'overdue'] }
    });
    
    if (existingIssue) {
        return res.status(400).json({ 
            message: 'This book is already issued to this user' 
        });
    }
    
    // Calculate due date if not provided
    let calculatedDueDate = dueDate;
    if (!calculatedDueDate) {
        const issueDuration = settings.librarySettings.bookIssueDuration;
        calculatedDueDate = new Date();
        calculatedDueDate.setDate(calculatedDueDate.getDate() + issueDuration);
    }
    
    // Create book issue record
    const bookIssue = new BookIssue({
        book: bookId,
        issuedTo: user._id, // Store the actual user ObjectId
        issuedToModel,
        issuedBy,
        dueDate: calculatedDueDate,
        issueNotes
    });
    
    await bookIssue.save();
    
    // Update book status
    await Book.findByIdAndUpdate(bookId, { status: 'issued' });
    
    // Populate the response
    const populatedIssue = await BookIssue.findById(bookIssue._id)
        .populate({
            path: 'book',
            populate: [
                {
                    path: 'bookCatalog',
                    populate: { path: 'category', select: 'name description' }
                },
                {
                    path: 'rack',
                    select: 'rackNumber description'
                }
            ]
        })
        .populate('issuedBy', 'name email')
        .populate({
            path: 'issuedTo',
            select: 'name studentID employeeId'
        });
    
    res.status(201).json(populatedIssue);
});

// Return a book
exports.returnBook = catchAsync(async (req, res) => {
    const { isbn, studentId, bookIssueId, returnNotes } = req.body;
    const returnedTo = req.user.id;
    
    let bookIssue;
    
    // Find book issue by bookIssueId (preferred method)
    if (bookIssueId) {
        bookIssue = await BookIssue.findById(bookIssueId);
        if (!bookIssue) {
            return res.status(404).json({ message: 'Book issue not found' });
        }
        
        if (bookIssue.status !== 'issued' && bookIssue.status !== 'overdue') {
            return res.status(400).json({ message: 'This book is not currently issued' });
        }
    }
    // Find book issue by ISBN
    else if (isbn) {
        const book = await Book.findOne({ isbn, isActive: true });
        if (!book) {
            return res.status(404).json({ message: 'Book not found with this ISBN' });
        }
        
        bookIssue = await BookIssue.findOne({
            book: book._id,
            status: { $in: ['issued', 'overdue'] }
        });
    } 
    // Find book issue by student ID (returns first book if multiple)
    else if (studentId) {
        // First find the student by studentID
        const student = await Student.findOne({ studentID: studentId });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        // Get all active book issues for this student
        const activeIssues = await BookIssue.find({
            issuedTo: student._id,
            issuedToModel: 'Student',
            status: { $in: ['issued', 'overdue'] }
        }).populate({
            path: 'book',
            populate: [
                {
                    path: 'bookCatalog',
                    populate: { path: 'category', select: 'name description' }
                },
                {
                    path: 'rack',
                    select: 'rackNumber description'
                }
            ]
        });
        
        if (activeIssues.length === 0) {
            return res.status(404).json({ 
                message: 'No active book issues found for this student' 
            });
        }
        
        if (activeIssues.length > 1) {
            // Return list of books for selection
            return res.status(400).json({ 
                message: 'Student has multiple books issued. Please specify which book to return.',
                activeIssues: activeIssues.map(issue => ({
                    _id: issue._id,
                    bookTitle: issue.book?.bookCatalog?.title || 'Unknown',
                    bookISBN: issue.book?.bookCatalog?.isbn || 'Unknown',
                    copyNumber: issue.book?.copyNumber || 'Unknown',
                    issueDate: issue.issueDate,
                    dueDate: issue.dueDate,
                    status: issue.status
                }))
            });
        }
        
        bookIssue = activeIssues[0];
    } else {
        return res.status(400).json({ 
            message: 'Either bookIssueId, ISBN, or student ID is required' 
        });
    }
    
    if (!bookIssue) {
        return res.status(404).json({ 
            message: 'No active book issue found' 
        });
    }
    
    // Calculate fine if overdue
    let fineAmount = 0;
    if (bookIssue.status === 'overdue' || new Date() > bookIssue.dueDate) {
        const daysOverdue = Math.ceil((new Date() - bookIssue.dueDate) / (1000 * 60 * 60 * 24));
        fineAmount = daysOverdue * 1; // $1 per day (adjust as needed)
    }
    
    // Update book issue
    bookIssue.status = 'returned';
    bookIssue.returnDate = new Date();
    bookIssue.returnedTo = returnedTo;
    bookIssue.returnNotes = returnNotes;
    bookIssue.fineAmount = fineAmount;
    
    await bookIssue.save();
    
    // Update book status
    await Book.findByIdAndUpdate(bookIssue.book, { status: 'available' });
    
    // Populate the response
    const populatedIssue = await BookIssue.findById(bookIssue._id)
        .populate({
            path: 'book',
            populate: [
                {
                    path: 'bookCatalog',
                    populate: { path: 'category', select: 'name description' }
                },
                {
                    path: 'rack',
                    select: 'rackNumber description'
                }
            ]
        })
        .populate('issuedBy', 'name email')
        .populate('returnedTo', 'name email')
        .populate({
            path: 'issuedTo',
            select: 'name studentID employeeId'
        });
    
    res.status(200).json({
        message: 'Book returned successfully',
        bookIssue: populatedIssue,
        fineAmount
    });
});

// Renew a book
exports.renewBook = catchAsync(async (req, res) => {
    const { bookIssueId } = req.params;
    
    // Validate that bookIssueId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(bookIssueId)) {
        return res.status(400).json({
            status: 'ERROR',
            message: 'Invalid book issue ID format'
        });
    }
    
    const bookIssue = await BookIssue.findById(bookIssueId);
    if (!bookIssue) {
        return res.status(404).json({ message: 'Book issue not found' });
    }
    
    if (bookIssue.status !== 'issued' && bookIssue.status !== 'overdue') {
        return res.status(400).json({ 
            message: 'Book cannot be renewed. It is not currently issued.' 
        });
    }
    
    // Get library settings
    const settings = await Settings.findOne().sort({ createdAt: -1 });
    if (!settings || !settings.librarySettings) {
        return res.status(500).json({ message: 'Library settings not configured' });
    }
    
    // Check renewal limit
    if (bookIssue.renewalCount >= settings.librarySettings.maxRenewals) {
        return res.status(400).json({ 
            message: `Maximum renewals (${settings.librarySettings.maxRenewals}) reached for this book` 
        });
    }
    
    // Calculate new due date
    const issueDuration = settings.librarySettings.bookIssueDuration;
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + issueDuration);
    
    // Update book issue
    bookIssue.dueDate = newDueDate;
    bookIssue.renewalCount += 1;
    bookIssue.lastRenewalDate = new Date();
    bookIssue.status = 'issued'; // Reset to issued if it was overdue
    
    await bookIssue.save();
    
    // Populate the response
    const populatedIssue = await BookIssue.findById(bookIssue._id)
        .populate({
            path: 'book',
            populate: [
                {
                    path: 'bookCatalog',
                    populate: { path: 'category', select: 'name description' }
                },
                {
                    path: 'rack',
                    select: 'rackNumber description'
                }
            ]
        })
        .populate('issuedBy', 'name email')
        .populate({
            path: 'issuedTo',
            select: 'name studentID employeeId'
        });
    
    res.status(200).json({
        message: 'Book renewed successfully',
        bookIssue: populatedIssue
    });
});

// Get all book issues with filtering
exports.getBookIssues = catchAsync(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        status, 
        issuedTo, 
        issuedToModel,
        overdue 
    } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (issuedTo && issuedTo.trim() !== '') {
        // If issuedTo is not a valid ObjectId, try to find user by studentID or employeeId
        if (!mongoose.Types.ObjectId.isValid(issuedTo)) {
            // Try to find user by studentID or employeeId
            let user = null;
            
            if (issuedToModel === 'Student') {
                // Use regex for partial matching of studentID
                const regex = new RegExp(issuedTo, 'i'); // 'i' for case-insensitive
                const users = await Student.find({ studentID: regex }).select('_id studentID studentName');
                
                if (users.length === 0) {
                    // Return empty result set instead of error when no users found
                    return res.status(200).json({
                        bookIssues: [],
                        pagination: {
                            currentPage: parseInt(page),
                            totalPages: 0,
                            totalIssues: 0,
                            hasNext: false,
                            hasPrev: false
                        },
                        searchInfo: {
                            searchTerm: issuedTo,
                            userType: issuedToModel,
                            matchingUsers: 0,
                            userDetails: [],
                            message: `No ${issuedToModel.toLowerCase()} found with ${issuedToModel === 'Student' ? 'Student ID' : 'Employee ID'} containing "${issuedTo}"`
                        }
                    });
                }
                
                // Get all book issues for all matching users
                const userIds = users.map(user => user._id);
                query.issuedTo = { $in: userIds };
            } else if (issuedToModel === 'Teacher') {
                // Use regex for partial matching of employeeId
                const regex = new RegExp(issuedTo, 'i'); // 'i' for case-insensitive
                const users = await Teacher.find({ employeeId: regex }).select('_id employeeId employeeName');
                
                if (users.length === 0) {
                    // Return empty result set instead of error when no users found
                    return res.status(200).json({
                        bookIssues: [],
                        pagination: {
                            currentPage: parseInt(page),
                            totalPages: 0,
                            totalIssues: 0,
                            hasNext: false,
                            hasPrev: false
                        },
                        searchInfo: {
                            searchTerm: issuedTo,
                            userType: issuedToModel,
                            matchingUsers: 0,
                            userDetails: [],
                            message: `No ${issuedToModel.toLowerCase()} found with ${issuedToModel === 'Student' ? 'Student ID' : 'Employee ID'} containing "${issuedTo}"`
                        }
                    });
                }
                
                // Get all book issues for all matching users
                const userIds = users.map(user => user._id);
                query.issuedTo = { $in: userIds };
            }
        } else {
            query.issuedTo = issuedTo;
        }
    }
    if (issuedToModel) query.issuedToModel = issuedToModel;
    
    // Filter for overdue books
    if (overdue === 'true') {
        query.status = { $in: ['issued', 'overdue'] };
        query.dueDate = { $lt: new Date() };
    }
    
    const skip = (page - 1) * limit;
    
        let bookIssues = await BookIssue.find(query)
        .populate({
            path: 'book',
            populate: [
                {
                    path: 'bookCatalog',
                    populate: { path: 'category', select: 'name description' }
                },
                {
                    path: 'rack',
                    select: 'rackNumber description'
                }
            ]
        })
        .populate('issuedBy', 'name email')
        .populate('returnedTo', 'name email')
        .sort({ issueDate: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    // Manually populate issuedTo field for each book issue
    for (let bookIssue of bookIssues) {
        if (bookIssue.issuedToModel === 'Student') {
            const student = await Student.findById(bookIssue.issuedTo).select('studentName studentID Email');
            bookIssue.issuedTo = student;
        } else if (bookIssue.issuedToModel === 'Teacher') {
            const teacher = await Teacher.findById(bookIssue.issuedTo).select('employeeName employeeId email');
            bookIssue.issuedTo = teacher;
        }
    }

    const total = await BookIssue.countDocuments(query);
    
    // Add search info if partial search was performed
    let searchInfo = null;
    if (issuedTo && issuedToModel && !mongoose.Types.ObjectId.isValid(issuedTo)) {
        if (issuedToModel === 'Student') {
            const regex = new RegExp(issuedTo, 'i');
            const matchingUsers = await Student.find({ studentID: regex }).select('_id studentID studentName');
            
            // Only include users who actually have book issues
            const usersWithIssues = [];
            for (const user of matchingUsers) {
                const userIssues = await BookIssue.countDocuments({
                    issuedTo: user._id,
                    issuedToModel: 'Student'
                });
                if (userIssues > 0) {
                    usersWithIssues.push({
                        id: user._id,
                        name: user.studentName,
                        identifier: user.studentID,
                        issueCount: userIssues
                    });
                }
            }
            
            searchInfo = {
                searchTerm: issuedTo,
                userType: issuedToModel,
                matchingUsers: usersWithIssues.length,
                userDetails: usersWithIssues
            };
        } else if (issuedToModel === 'Teacher') {
            const regex = new RegExp(issuedTo, 'i');
            const matchingUsers = await Teacher.find({ employeeId: regex }).select('_id employeeId employeeName');
            
            // Only include users who actually have book issues
            const usersWithIssues = [];
            for (const user of matchingUsers) {
                const userIssues = await BookIssue.countDocuments({
                    issuedTo: user._id,
                    issuedToModel: 'Teacher'
                });
                if (userIssues > 0) {
                    usersWithIssues.push({
                        id: user._id,
                        name: user.employeeName,
                        identifier: user.employeeId,
                        issueCount: userIssues
                    });
                }
            }
            
            searchInfo = {
                searchTerm: issuedTo,
                userType: issuedToModel,
                matchingUsers: usersWithIssues.length,
                userDetails: usersWithIssues
            };
        }
    }
    
    res.status(200).json({
        bookIssues,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalIssues: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
        },
        searchInfo
    });
});

// Get book issue by ID
exports.getBookIssueById = catchAsync(async (req, res) => {
    const { id } = req.params;
    
    // Validate that id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            status: 'ERROR',
            message: 'Invalid book issue ID format'
        });
    }
    
    const bookIssue = await BookIssue.findById(id)
        .populate({
            path: 'book',
            populate: [
                {
                    path: 'bookCatalog',
                    populate: { path: 'category', select: 'name description' }
                },
                {
                    path: 'rack',
                    select: 'rackNumber description'
                }
            ]
        })
        .populate('issuedBy', 'name email')
        .populate('returnedTo', 'name email')
        .populate({
            path: 'issuedTo',
            select: 'name studentID employeeId'
        });
    
    if (!bookIssue) {
        return res.status(404).json({ message: 'Book issue not found' });
    }
    
    res.status(200).json(bookIssue);
});

// Get user's issued books
exports.getUserIssuedBooks = catchAsync(async (req, res) => {
    const { userId, userType } = req.params;
    
    // Validate that userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
            status: 'ERROR',
            message: 'Invalid user ID format'
        });
    }
    
    const bookIssues = await BookIssue.find({
        issuedTo: userId,
        issuedToModel: userType,
        status: { $in: ['issued', 'overdue'] }
    })
    .populate({
        path: 'book',
        populate: [
            {
                path: 'bookCatalog',
                populate: { path: 'category', select: 'name description' }
            },
            {
                path: 'rack',
                select: 'rackNumber description'
            }
        ]
    })
    .populate('issuedBy', 'name email')
    .populate({
        path: 'issuedTo',
        select: 'name studentID employeeId'
    })
    .sort({ issueDate: -1 });
    
    res.status(200).json(bookIssues);
});

// Get overdue books
exports.getOverdueBooks = catchAsync(async (req, res) => {
    const overdueBooks = await BookIssue.find({
        status: { $in: ['issued', 'overdue'] },
        dueDate: { $lt: new Date() }
    })
    .populate({
        path: 'book',
        populate: [
            {
                path: 'bookCatalog',
                populate: { path: 'category', select: 'name description' }
            },
            {
                path: 'rack',
                select: 'rackNumber description'
            }
        ]
    })
    .populate('issuedBy', 'name email')
    .populate({
        path: 'issuedTo',
        select: 'name studentID employeeId'
    })
    .sort({ dueDate: 1 });
    
    res.status(200).json(overdueBooks);
});

// Pay fine
exports.payFine = catchAsync(async (req, res) => {
    const { bookIssueId } = req.params;
    
    // Validate that bookIssueId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(bookIssueId)) {
        return res.status(400).json({
            status: 'ERROR',
            message: 'Invalid book issue ID format'
        });
    }
    
    const bookIssue = await BookIssue.findById(bookIssueId);
    if (!bookIssue) {
        return res.status(404).json({ message: 'Book issue not found' });
    }
    
    if (bookIssue.fineAmount <= 0) {
        return res.status(400).json({ message: 'No fine to pay' });
    }
    
    if (bookIssue.finePaid) {
        return res.status(400).json({ message: 'Fine already paid' });
    }
    
    bookIssue.finePaid = true;
    bookIssue.finePaidDate = new Date();
    await bookIssue.save();
    
    res.status(200).json({
        message: 'Fine paid successfully',
        bookIssue
    });
});

// Get library statistics
exports.getLibraryStats = catchAsync(async (req, res) => {
    const totalIssues = await BookIssue.countDocuments();
    const activeIssues = await BookIssue.countDocuments({
        status: { $in: ['issued', 'overdue'] }
    });
    const overdueIssues = await BookIssue.countDocuments({
        status: { $in: ['issued', 'overdue'] },
        dueDate: { $lt: new Date() }
    });
    const totalFines = await BookIssue.aggregate([
        { $match: { fineAmount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$fineAmount' } } }
    ]);
    
    const paidFines = await BookIssue.aggregate([
        { $match: { finePaid: true } },
        { $group: { _id: null, total: { $sum: '$fineAmount' } } }
    ]);
    
    const stats = {
        totalIssues,
        activeIssues,
        overdueIssues,
        totalFines: totalFines[0]?.total || 0,
        paidFines: paidFines[0]?.total || 0,
        pendingFines: (totalFines[0]?.total || 0) - (paidFines[0]?.total || 0)
    };
    
    res.status(200).json(stats);
});

// Get current teacher's issued books
exports.getTeachersIssuedBooks = catchAsync(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    
    // Get current teacher's ID from the request
    const currentTeacherId = req.user.id;
    
    const query = {
        issuedTo: currentTeacherId,
        issuedToModel: 'Teacher',
        status: { $in: ['issued', 'overdue', 'returned'] } // Include returned books for history
    };
    
    const skip = (page - 1) * limit;
    
    const bookIssues = await BookIssue.find(query)
        .populate({
            path: 'book',
            populate: [
                {
                    path: 'bookCatalog',
                    populate: { path: 'category', select: 'name description' }
                },
                {
                    path: 'rack',
                    select: 'rackNumber description'
                }
            ]
        })
        .populate('issuedBy', 'name email')
        .populate({
            path: 'issuedTo',
            select: 'employeeName employeeId email'
        })
        .sort({ issueDate: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    
    const total = await BookIssue.countDocuments(query);
    
    res.status(200).json({
        bookIssues,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalIssues: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
        }
    });
});
