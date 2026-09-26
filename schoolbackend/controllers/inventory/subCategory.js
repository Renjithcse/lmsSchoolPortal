const Product = require("../../models/Inventory/product");
const SubCategory = require("../../models/Inventory/subCategory");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");

// Get all subcategories
exports.getSubCategories = catchAsync(async (req, res, next) => {
    const subCategories = await SubCategory.find().populate("categoryId", "name");
    res.status(200).json({
        success: true,
        data: subCategories,
    });
});

// Get a single subcategory by ID
exports.getSubCategoryById = catchAsync(async (req, res, next) => {
    const subCategory = await SubCategory.findById(req.params.id).populate("categoryId", "name");
    if (!subCategory) {
        return next(new AppError("No subcategory found with that ID", 404));
    }
    res.status(200).json({
        success: true,
        data: subCategory,
    });
});

// Create a new subcategory
exports.createSubCategory = catchAsync(async (req, res, next) => {
    const { name, categoryId, description } = req.body;

    // Check if the subcategory name already exists under the same category
    const existingSubCategory = await SubCategory.findOne({ name, categoryId });
    if (existingSubCategory) {
        return next(new AppError("Subcategory with this name already exists in the selected category", 400));
    }

    const newSubCategory = await SubCategory.create({ name, categoryId, description });

    res.status(201).json({
        success: true,
        data: newSubCategory,
    });
});

// Update a subcategory
exports.updateSubCategory = catchAsync(async (req, res, next) => {
    const { name, categoryId, description } = req.body;

    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
        req.params.id,
        { name, categoryId, description },
        { new: true, runValidators: true }
    );

    if (!updatedSubCategory) {
        return next(new AppError("No subcategory found with that ID", 404));
    }

    res.status(200).json({
        success: true,
        data: updatedSubCategory,
    });
});

// Delete a subcategory only if it's not used in any product
exports.deleteSubCategory = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // Check if the subcategory is used in any product
    const isSubCategoryUsed = await Product.exists({ subCategory: id });

    if (isSubCategoryUsed) {
        return next(new AppError("Cannot delete subcategory. It is used in one or more products.", 400));
    }

    // Delete the subcategory
    const deletedSubCategory = await SubCategory.findByIdAndDelete(id);

    if (!deletedSubCategory) {
        return next(new AppError("No subcategory found with that ID", 404));
    }

    res.status(200).json({
        success: true,
        message: "Subcategory deleted successfully",
    });
});

// Get subcategories by categoryId
exports.getSubCategoriesByCategoryId = catchAsync(async (req, res, next) => {
    const { categoryId } = req.params;

    // Find subcategories with the given categoryId
    const subCategories = await SubCategory.find({ categoryId }).populate("categoryId", "name");

    if (!subCategories || subCategories.length === 0) {
        return next(new AppError("No subcategories found for the given category ID", 404));
    }

    res.status(200).json({
        success: true,
        data: subCategories,
    });
});