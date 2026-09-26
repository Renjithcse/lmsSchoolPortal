const BookCategory = require('../../models/Library/Category');
const catchAsync = require('../../utils/catchAsync');

// Create a new category
exports.createCategory = catchAsync(async (req, res) => {
    const category = new BookCategory(req.body);
    await category.save();
    res.status(201).json(category);
});

// Get all categories
exports.getCategories = catchAsync(async (req, res) => {
    const categories = await BookCategory.find({ isActive: true })
        .sort({ name: 1 });
    res.status(200).json(categories);
});

// Get a single category by ID
exports.getCategoryById = catchAsync(async (req, res) => {
    const category = await BookCategory.findById(req.params.id);
    
    if (!category) {
        return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(category);
});

// Update a category by ID
exports.updateCategory = catchAsync(async (req, res) => {
    const category = await BookCategory.findByIdAndUpdate(req.params.id, req.body, { 
        new: true,
        runValidators: true 
    });
    
    if (!category) {
        return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(category);
});

// Delete a category by ID (soft delete)
exports.deleteCategory = catchAsync(async (req, res) => {
    const categoryId = req.params.id;

    // Check if category exists
    const category = await BookCategory.findById(categoryId);
    if (!category) {
        return res.status(404).json({ message: 'Category not found' });
    }

    // Check if any books are using this category
    const Book = require('../../models/Library/Book');
    const booksInCategory = await Book.find({ category: categoryId, isActive: true });
    if (booksInCategory.length > 0) {
        return res.status(400).json({ 
            message: `Cannot delete category. There are ${booksInCategory.length} book(s) using this category. Please reassign or remove the books first.` 
        });
    }

    // Soft delete by setting isActive to false
    await BookCategory.findByIdAndUpdate(categoryId, { isActive: false });
    res.status(200).json({ message: 'Category deleted successfully' });
});
