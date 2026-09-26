const { SubCategory } = require('../../models/MarkEntry/Mark');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const Mark = require('../../models/MarkEntry/Mark');
const Category = require('../../models/MarkEntry/Mark');

//Get All Sub Categories
exports.getAllSubCategories = catchAsync(async (req, res, next) => {
    const subCategories = await SubCategory.find(req?.query);

    res.status(200).json({
        status: 'success',
        results: subCategories.length,
        data: subCategories
    });
});

//Create a new Sub Category
exports.createSubCategory = catchAsync(async (req, res, next) => {
    try {
        const newSubCategory = await SubCategory.create(req.body);
        res.status(201).json({
            status: 'success',
            data: newSubCategory
        });
    } catch (error) {
        return next(new AppError('Invalid input', 400));
    }
});

// Update sub category
exports.updateSubCategory = catchAsync(async (req, res, next) => {
    try {
        const updatedSubCategory = await SubCategory.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});
        if (!updatedSubCategory) return next(new AppError('No subcategory found with that ID', 404));
        res.status(200).json({
            status: 'success',
            data: updatedSubCategory
        });
    } catch (error) {
        if (error.name === 'ValidationError') return next(new AppError(error.message, 400));
        return next(error);
    }
});

// Delete sub category
exports.deleteSubCategory = catchAsync(async (req, res, next) => {
    const subCategoryId = req.params.id;

    // First, check if the subcategory exists
    const subCategory = await SubCategory.findById(subCategoryId);
    if (!subCategory) {
        return next(new AppError('No subcategory found with that ID', 404));
    }

    // Check if the subcategory is being used in Mark model
    const marks = await Mark.find({ subCategory: subCategoryId });
    if (marks.length > 0) {
        return next(new AppError(
            `Cannot delete subcategory. This subcategory is being used by ${marks.length} mark record(s). Please delete the mark records first.`, 
            400
        ));
    }

    // Check if the subcategory is being used in Category model
    const categories = await Category.find({ subCategory: { $in: [subCategoryId] } });
    if (categories.length > 0) {
        return next(new AppError(
            `Cannot delete subcategory. This subcategory is being used by ${categories.length} category record(s). Please remove the subcategory from the categories first.`, 
            400
        ));
    }

    // If no dependencies exist, proceed with deletion
    await SubCategory.findByIdAndDelete(subCategoryId);

    res.status(204).json({
        status: 'success',
        data: null
    });
});