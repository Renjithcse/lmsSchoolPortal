const Book = require('../../models/Library/Book');
const BookCatalog = require('../../models/Library/BookCatalog');
const Rack = require('../../models/Library/Rack');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const { uploadLibraryImageToS3, deleteLibraryS3File, extractS3KeyFromUrl } = require('../../utils/libraryS3Helper');

// Create a new book copy
exports.createBook = catchAsync(async (req, res) => {
    const { bookCatalog, copyNumber, rack, row, position, coverImage, ...otherFields } = req.body;
    
    // Validate book catalog exists
    const catalogExists = await BookCatalog.findById(bookCatalog);
    if (!catalogExists) {
        return res.status(400).json({ message: 'Book catalog not found' });
    }
    
    // Validate rack exists
    const rackExists = await Rack.findById(rack);
    if (!rackExists) {
        return res.status(400).json({ message: 'Rack not found' });
    }
    
    // Validate row number
    if (row > rackExists.numberOfRows) {
        return res.status(400).json({ 
            message: `Row number ${row} exceeds the maximum rows (${rackExists.numberOfRows}) for this rack` 
        });
    }
    
    // Check if copy number already exists for this catalog
    const existingCopy = await Book.findOne({ 
        bookCatalog, 
        copyNumber, 
        isActive: true 
    });
    
    if (existingCopy) {
        return res.status(400).json({ 
            message: `Copy number ${copyNumber} already exists for this book` 
        });
    }
    
    // Check if position is already occupied
    const existingBook = await Book.findOne({ 
        rack, 
        row, 
        position, 
        isActive: true 
    });
    
    if (existingBook) {
        return res.status(400).json({ 
            message: `Position ${position} in row ${row} of rack ${rackExists.rackNumber} is already occupied by another book copy` 
        });
    }
    
    let coverImageData = null;

    // Upload cover image to S3 if provided
    if (coverImage && coverImage.includes('data:image')) {
        try {
            coverImageData = await uploadLibraryImageToS3(coverImage, 'library');
        } catch (error) {
            return next(new AppError(`Failed to upload cover image: ${error.message}`, 400));
        }
    }

    const bookData = {
        bookCatalog,
        copyNumber,
        rack,
        row,
        position,
        ...otherFields,
        coverImage: coverImageData ? coverImageData.url : null,
        coverImageS3Key: coverImageData ? coverImageData.key : null
    };

    const book = new Book(bookData);
    await book.save();
    
    const populatedBook = await Book.findById(book._id)
        .populate('bookCatalog')
        .populate('rack', 'rackNumber description');
    
    res.status(201).json(populatedBook);
});

// Get all book copies with filtering and pagination
exports.getBooks = catchAsync(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        search, 
        status, 
        category, 
        rack,
        author 
    } = req.query;
    
    const query = { isActive: true };
    
    // Search functionality - search in book catalog
    if (search) {
        // First find matching book catalogs
        const matchingCatalogs = await BookCatalog.find({
            $or: [
                { title: { $regex: search, $options: 'i' } },
                { author: { $regex: search, $options: 'i' } },
                { isbn: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } }
            ],
            isActive: true
        }).select('_id');
        
        const catalogIds = matchingCatalogs.map(cat => cat._id);
        query.bookCatalog = { $in: catalogIds };
    }
    
    if (status) query.status = status;
    if (rack) query.rack = rack;
    
    // Filter by category - search in book catalog
    if (category) {
        const catalogsInCategory = await BookCatalog.find({
            category,
            isActive: true
        }).select('_id');
        
        const catalogIds = catalogsInCategory.map(cat => cat._id);
        query.bookCatalog = { $in: catalogIds };
    }
    
    // Filter by author - search in book catalog
    if (author) {
        const catalogsByAuthor = await BookCatalog.find({
            author: { $regex: author, $options: 'i' },
            isActive: true
        }).select('_id');
        
        const catalogIds = catalogsByAuthor.map(cat => cat._id);
        query.bookCatalog = { $in: catalogIds };
    }
    
    const skip = (page - 1) * limit;
    
    const books = await Book.find(query)
        .populate({
            path: 'bookCatalog',
            populate: { path: 'category', select: 'name description' }
        })
        .populate('rack', 'rackNumber description')
        .sort({ 'bookCatalog.title': 1, copyNumber: 1 })
        .skip(skip)
        .limit(parseInt(limit));
    
    const total = await Book.countDocuments(query);
    
    res.status(200).json({
        books,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalBooks: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
        }
    });
});

// Get a single book by ID
exports.getBookById = catchAsync(async (req, res) => {
    const book = await Book.findById(req.params.id)
        .populate('rack', 'rackNumber description numberOfRows')
        .populate('category', 'name description');
    
    if (!book) {
        return res.status(404).json({ message: 'Book not found' });
    }
    res.status(200).json(book);
});

// Get book by ISBN
exports.getBookByISBN = catchAsync(async (req, res) => {
    const book = await Book.findOne({ 
        isbn: req.params.isbn, 
        isActive: true 
    })
    .populate('rack', 'rackNumber description');
    
    if (!book) {
        return res.status(404).json({ message: 'Book not found' });
    }
    res.status(200).json(book);
});

// Update a book by ID
exports.updateBook = catchAsync(async (req, res) => {
    const { rack, row, position, coverImage, ...otherFields } = req.body;
    
    // If position is being changed, validate it
    if (rack && row && position) {
        const rackExists = await Rack.findById(rack);
        if (!rackExists) {
            return res.status(400).json({ message: 'Rack not found' });
        }
        
        if (row > rackExists.numberOfRows) {
            return res.status(400).json({ 
                message: `Row number ${row} exceeds the maximum rows (${rackExists.numberOfRows}) for this rack` 
            });
        }
        
        // Check if position is already occupied by another book
        const existingBook = await Book.findOne({ 
            rack, 
            row, 
            position, 
            isActive: true,
            _id: { $ne: req.params.id } // Exclude current book
        });
        
        if (existingBook) {
            return res.status(400).json({ 
                message: `Position ${position} in row ${row} of rack ${rackExists.rackNumber} is already occupied by book: ${existingBook.title}` 
            });
        }
    }
    
    // Get the existing book first
    const existingBook = await Book.findById(req.params.id);
    if (!existingBook) {
        return res.status(404).json({ message: 'Book not found' });
    }

    let coverImageData = null;
    let updateData = { rack, row, position, ...otherFields };

    // Handle cover image update
    if (coverImage && coverImage.includes('data:image')) {
        try {
            coverImageData = await uploadLibraryImageToS3(coverImage, 'library');
            
            // Delete old cover image from S3 if it exists
            if (existingBook.coverImageS3Key) {
                try {
                    await deleteLibraryS3File(existingBook.coverImageS3Key);
                    console.log(`Successfully deleted old book cover: ${existingBook.coverImageS3Key}`);
                } catch (error) {
                    console.error('Error deleting old book cover:', error);
                }
            }

            updateData.coverImage = coverImageData.url;
            updateData.coverImageS3Key = coverImageData.key;
        } catch (error) {
            return next(new AppError(`Failed to upload cover image: ${error.message}`, 400));
        }
    }

    const book = await Book.findByIdAndUpdate(req.params.id, updateData, { 
        new: true,
        runValidators: true 
    })
    .populate('rack', 'rackNumber description');
    
    if (!book) {
        return res.status(404).json({ message: 'Book not found' });
    }
    res.status(200).json(book);
});

// Delete a book by ID (soft delete)
exports.deleteBook = catchAsync(async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (!book) {
        return res.status(404).json({ message: 'Book not found' });
    }
    
    // Check if book is currently issued
    if (book.status === 'issued') {
        return res.status(400).json({ 
            message: 'Cannot delete book. It is currently issued to someone.' 
        });
    }
    
    // Delete associated cover image from S3
    if (book.coverImageS3Key) {
        try {
            await deleteLibraryS3File(book.coverImageS3Key);
            console.log(`Successfully deleted book cover: ${book.coverImageS3Key}`);
        } catch (error) {
            console.error('Error deleting S3 file:', error);
            // Continue with deletion even if S3 deletion fails
        }
    }

    // Soft delete
    await Book.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(200).json({ message: 'Book deleted successfully' });
});

// Get available positions in a rack
exports.getAvailablePositions = catchAsync(async (req, res) => {
    const { rackId, row } = req.query;
    
    if (!rackId) {
        return res.status(400).json({ message: 'Rack ID is required' });
    }
    
    const rack = await Rack.findById(rackId);
    if (!rack) {
        return res.status(404).json({ message: 'Rack not found' });
    }
    
    const maxRows = rack.numberOfRows;
    const positions = [];
    
    // If specific row is requested
    if (row) {
        if (row > maxRows) {
            return res.status(400).json({ 
                message: `Row ${row} exceeds maximum rows (${maxRows})` 
            });
        }
        
        // Get occupied positions in this row
        const occupiedBooks = await Book.find({ 
            rack: rackId, 
            row: parseInt(row), 
            isActive: true 
        }).select('position');
        
        const occupiedPositions = occupiedBooks.map(book => book.position);
        
        // Find available positions (assuming max 50 positions per row)
        for (let i = 1; i <= 50; i++) {
            if (!occupiedPositions.includes(i)) {
                positions.push(i);
            }
        }
    } else {
        // Return all available positions for all rows
        for (let r = 1; r <= maxRows; r++) {
            const occupiedBooks = await Book.find({ 
                rack: rackId, 
                row: r, 
                isActive: true 
            }).select('position');
            
            const occupiedPositions = occupiedBooks.map(book => book.position);
            const availableInRow = [];
            
            for (let i = 1; i <= 50; i++) {
                if (!occupiedPositions.includes(i)) {
                    availableInRow.push(i);
                }
            }
            
            if (availableInRow.length > 0) {
                positions.push({
                    row: r,
                    availablePositions: availableInRow
                });
            }
        }
    }
    
    res.status(200).json({
        rack: rack.rackNumber,
        maxRows,
        positions
    });
});

// Get book statistics
exports.getBookStats = catchAsync(async (req, res) => {
    const totalBooks = await Book.countDocuments({ isActive: true });
    const availableBooks = await Book.countDocuments({ 
        status: 'available', 
        isActive: true 
    });
    const issuedBooks = await Book.countDocuments({ 
        status: 'issued', 
        isActive: true 
    });
    const lostBooks = await Book.countDocuments({ 
        status: 'lost', 
        isActive: true 
    });
    const damagedBooks = await Book.countDocuments({ 
        status: 'damaged', 
        isActive: true 
    });
    
    // Books by category
    const booksByCategory = await Book.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    
    // Books by condition
    const booksByCondition = await Book.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$condition', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    
    const stats = {
        totalBooks,
        availableBooks,
        issuedBooks,
        lostBooks,
        damagedBooks,
        utilizationRate: totalBooks > 0 ? ((totalBooks - availableBooks) / totalBooks) * 100 : 0,
        booksByCategory,
        booksByCondition
    };
    
    res.status(200).json(stats);
});
