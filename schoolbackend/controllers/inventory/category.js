
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const Product = require("../../models/Inventory/product");
const Category = require("../../models/Inventory/category");
const SubCategory = require("../../models/Inventory/subCategory");
const Purchase = require("../../models/Inventory/purchase");
const Sale = require("../../models/Inventory/sales");
const Stock = require("../../models/Inventory/stock");

// Get all categories
exports.getCategories = catchAsync(async (req, res, next) => {
    const categories = await Category.find();
    res.status(200).json({
        success: true,
        data: categories,
    });
});

// Get a single category by ID
exports.getCategoryById = catchAsync(async (req, res, next) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
        return next(new AppError("No category found with that ID", 404));
    }
    res.status(200).json({
        success: true,
        data: category,
    });
});

// Create a new category
exports.createCategory = catchAsync(async (req, res, next) => {
    const { name, description } = req.body;

    // Check if the category name already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
        return next(new AppError("Category with this name already exists", 400));
    }

    const newCategory = await Category.create({ name, description });

    res.status(201).json({
        success: true,
        data: newCategory,
    });
});

// Update a category
exports.updateCategory = catchAsync(async (req, res, next) => {
    const { name, description } = req.body;

    const updatedCategory = await Category.findByIdAndUpdate(
        req.params.id,
        { name, description },
        { new: true, runValidators: true }
    );

    if (!updatedCategory) {
        return next(new AppError("No category found with that ID", 404));
    }

    res.status(200).json({
        success: true,
        data: updatedCategory,
    });
});


// Delete a category only if it's not used in any inventory models
exports.deleteCategory = catchAsync(async (req, res, next) => {
    const categoryId = req.params.id;

    // First, check if the category exists
    const category = await Category.findById(categoryId);
    if (!category) {
        return next(new AppError("No category found with that ID", 404));
    }

    // Check if the category is being used in SubCategory model
    const subCategories = await SubCategory.find({ categoryId: categoryId });
    if (subCategories.length > 0) {
        return next(new AppError(
            `Cannot delete category. This category is being used by ${subCategories.length} sub-category record(s). Please delete the sub-categories first.`, 
            400
        ));
    }

    // Check if the category is being used in Product model
    const products = await Product.find({ productCategory: categoryId });
    if (products.length > 0) {
        return next(new AppError(
            `Cannot delete category. This category is being used by ${products.length} product record(s). Please delete the products first.`, 
            400
        ));
    }

    // Check if the category is being used in Purchase model (through products)
    const productIds = products.map(product => product._id);
    const purchases = await Purchase.find({ 
        "products.productId": { $in: productIds } 
    });
    if (purchases.length > 0) {
        return next(new AppError(
            `Cannot delete category. This category is being used by ${purchases.length} purchase record(s). Please delete the purchases first.`, 
            400
        ));
    }

    // Check if the category is being used in Sale model (through products)
    const sales = await Sale.find({ 
        "products.productId": { $in: productIds } 
    });
    if (sales.length > 0) {
        return next(new AppError(
            `Cannot delete category. This category is being used by ${sales.length} sale record(s). Please delete the sales first.`, 
            400
        ));
    }

    // Check if the category is being used in Stock model (through products)
    const stocks = await Stock.find({ 
        productId: { $in: productIds } 
    });
    if (stocks.length > 0) {
        return next(new AppError(
            `Cannot delete category. This category is being used by ${stocks.length} stock record(s). Please delete the stock records first.`, 
            400
        ));
    }

    // If no dependencies exist, proceed with deletion
    await Category.findByIdAndDelete(categoryId);

    res.status(200).json({
        success: true,
        message: "Category deleted successfully",
    });
});