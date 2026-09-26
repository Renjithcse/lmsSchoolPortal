const BookCatalog = require('../../models/Library/BookCatalog');
const Book = require('../../models/Library/Book');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const { uploadLibraryImageToS3, deleteLibraryS3File, extractS3KeyFromUrl } = require('../../utils/libraryS3Helper');

// Create a new book catalog
exports.createBookCatalog = catchAsync(async (req, res) => {
    const { coverImage, ...otherFields } = req.body;
    let coverImageData = null;

    // Upload cover image to S3 if provided
    if (coverImage && coverImage.includes('data:image')) {
        try {
            coverImageData = await uploadLibraryImageToS3(coverImage, 'library');
        } catch (error) {
            return next(new AppError(`Failed to upload cover image: ${error.message}`, 400));
        }
    }

    const bookCatalogData = {
        ...otherFields,
        coverImage: coverImageData ? coverImageData.url : null,
        coverImageS3Key: coverImageData ? coverImageData.key : null
    };

    const bookCatalog = new BookCatalog(bookCatalogData);
    await bookCatalog.save();
    
    res.status(201).json({
        status: 'success',
        data: bookCatalog
    });
});

// Get all book catalogs with copy count
exports.getBookCatalogs = catchAsync(async (req, res) => {
    const { page = 1, limit = 10, search = '', category = '' } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build query
    let query = { isActive: true };
    
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
    
    // Get book catalogs with copy count
    const bookCatalogs = await BookCatalog.find(query)
        .populate('category', 'name')
        .sort({ title: 1 })
        .skip(skip)
        .limit(parseInt(limit));
    
    // Get copy counts for each catalog
    const catalogsWithCopyCount = await Promise.all(
        bookCatalogs.map(async (catalog) => {
            const copyCount = await Book.countDocuments({ 
                bookCatalog: catalog._id, 
                isActive: true 
            });
            
            const availableCount = await Book.countDocuments({ 
                bookCatalog: catalog._id, 
                status: 'available',
                isActive: true 
            });
            
            return {
                ...catalog.toObject(),
                totalCopies: copyCount,
                availableCopies: availableCount
            };
        })
    );
    
    const total = await BookCatalog.countDocuments(query);
    
    res.status(200).json({
        status: 'success',
        data: {
            catalogs: catalogsWithCopyCount,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalCatalogs: total,
                limit: parseInt(limit)
            }
        }
    });
});

// Get book catalog by ID
exports.getBookCatalogById = catchAsync(async (req, res) => {
    const bookCatalog = await BookCatalog.findById(req.params.id)
        .populate('category', 'name');
    
    if (!bookCatalog) {
        return res.status(404).json({
            status: 'error',
            message: 'Book catalog not found'
        });
    }
    
    // Get all copies of this book
    const copies = await Book.find({ 
        bookCatalog: bookCatalog._id, 
        isActive: true 
    })
    .populate('rack', 'rackNumber description')
    .sort({ copyNumber: 1 });
    
    res.status(200).json({
        status: 'success',
        data: {
            catalog: bookCatalog,
            copies: copies
        }
    });
});

// Update book catalog
exports.updateBookCatalog = catchAsync(async (req, res) => {
    const catalogId = req.params.id;
    const { coverImage, ...otherFields } = req.body;

    // Get the existing book catalog first
    const existingCatalog = await BookCatalog.findById(catalogId);
    if (!existingCatalog) {
        return res.status(404).json({
            status: 'error',
            message: 'Book catalog not found'
        });
    }

    let coverImageData = null;
    let updateData = { ...otherFields };

    // Handle cover image update
    if (coverImage && coverImage.includes('data:image')) {
        try {
            coverImageData = await uploadLibraryImageToS3(coverImage, 'library');
            
            // Delete old cover image from S3 if it exists
            if (existingCatalog.coverImageS3Key) {
                try {
                    await deleteLibraryS3File(existingCatalog.coverImageS3Key);
                    console.log(`Successfully deleted old book catalog cover: ${existingCatalog.coverImageS3Key}`);
                } catch (error) {
                    console.error('Error deleting old book catalog cover:', error);
                }
            }

            updateData.coverImage = coverImageData.url;
            updateData.coverImageS3Key = coverImageData.key;
        } catch (error) {
            return next(new AppError(`Failed to upload cover image: ${error.message}`, 400));
        }
    }

    const bookCatalog = await BookCatalog.findByIdAndUpdate(
        catalogId,
        updateData,
        { new: true, runValidators: true }
    ).populate('category', 'name');
    
    res.status(200).json({
        status: 'success',
        data: bookCatalog
    });
});

// Delete book catalog (soft delete)
exports.deleteBookCatalog = catchAsync(async (req, res) => {
    const bookCatalogId = req.params.id;
    
    // Get the book catalog first to access S3 key
    const bookCatalog = await BookCatalog.findById(bookCatalogId);
    if (!bookCatalog) {
        return res.status(404).json({
            status: 'error',
            message: 'Book catalog not found'
        });
    }
    
    // Check if there are any active copies
    const activeCopies = await Book.countDocuments({ 
        bookCatalog: bookCatalogId, 
        isActive: true 
    });
    
    if (activeCopies > 0) {
        return res.status(400).json({
            status: 'error',
            message: `Cannot delete book catalog. There are ${activeCopies} active copy(ies). Please remove all copies first.`
        });
    }
    
    // Delete associated cover image from S3
    if (bookCatalog.coverImageS3Key) {
        try {
            await deleteLibraryS3File(bookCatalog.coverImageS3Key);
            console.log(`Successfully deleted book catalog cover: ${bookCatalog.coverImageS3Key}`);
        } catch (error) {
            console.error('Error deleting S3 file:', error);
            // Continue with deletion even if S3 deletion fails
        }
    }
    
    await BookCatalog.findByIdAndUpdate(bookCatalogId, { isActive: false });
    
    res.status(200).json({
        status: 'success',
        message: 'Book catalog deleted successfully'
    });
});

// Get book catalog by ISBN
exports.getBookCatalogByISBN = catchAsync(async (req, res) => {
    const bookCatalog = await BookCatalog.findOne({ 
        isbn: req.params.isbn,
        isActive: true 
    }).populate('category', 'name');
    
    if (!bookCatalog) {
        return res.status(404).json({
            status: 'error',
            message: 'Book catalog not found'
        });
    }
    
    res.status(200).json({
        status: 'success',
        data: bookCatalog
    });
});
