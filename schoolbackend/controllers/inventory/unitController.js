const Product = require("../../models/Inventory/product");
const Unit = require("../../models/Inventory/unit");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");

// Create a new unit
exports.createUnit = catchAsync(async (req, res, next) => {
    const { name } = req.body;

    if (!name) {
        return next(new AppError("Unit name is required", 400));
    }

    const newUnit = await Unit.create({ name });

    res.status(201).json({
        success: true,
        data: newUnit,
    });
});

// Get all units
exports.getUnits = catchAsync(async (req, res, next) => {
    const units = await Unit.find();
    res.status(200).json({
        success: true,
        data: units,
    });
});

// Delete a unit only if it's not used in any product
exports.deleteUnit = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // Check if the unit is used in any product
    const isUnitUsed = await Product.exists({ unit: id });

    if (isUnitUsed) {
        return next(new AppError("Cannot delete unit. It is used in one or more products.", 400));
    }

    // Delete the unit
    const deletedUnit = await Unit.findByIdAndDelete(id);

    if (!deletedUnit) {
        return next(new AppError("No unit found with that ID", 404));
    }

    res.status(200).json({
        success: true,
        message: "Unit deleted successfully",
    });
});