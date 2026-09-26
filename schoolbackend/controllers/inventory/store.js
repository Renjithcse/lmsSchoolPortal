const Store = require("../../models/Inventory/store");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const Purchase = require("../../models/Inventory/purchase");
const Sale = require("../../models/Inventory/sales");
const Stock = require("../../models/Inventory/stock");

// Create a new store
exports.createStore = catchAsync(async (req, res, next) => {
    const { storeName, location } = req.body;

    // Check if the store name already exists
    const existingStore = await Store.findOne({ storeName });
    if (existingStore) {
        return next(new AppError("Store with this name already exists", 400));
    }

    const newStore = await Store.create({ storeName, location });

    res.status(201).json({
        success: true,
        data: newStore,
    });
});

// Get all stores
exports.getAllStores = catchAsync(async (req, res, next) => {
    const stores = await Store.find();

    res.status(200).json({
        success: true,
        data: stores,
    });
});

// Get a single store by ID
exports.getStoreById = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const store = await Store.findById(id);
    if (!store) {
        return next(new AppError("No store found with that ID", 404));
    }

    res.status(200).json({
        success: true,
        data: store,
    });
});

// Update a store
exports.updateStore = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { storeName, location } = req.body;

    const updatedStore = await Store.findByIdAndUpdate(
        id,
        { storeName, location },
        { new: true, runValidators: true }
    );

    if (!updatedStore) {
        return next(new AppError("No store found with that ID", 404));
    }

    res.status(200).json({
        success: true,
        data: updatedStore,
    });
});

// Delete a store only if it's not used in any inventory models
exports.deleteStore = catchAsync(async (req, res, next) => {
    const storeId = req.params.id;

    // First, check if the store exists
    const store = await Store.findById(storeId);
    if (!store) {
        return next(new AppError("No store found with that ID", 404));
    }

    // Check if the store is being used in Purchase model
    const purchases = await Purchase.find({ store: storeId });
    if (purchases.length > 0) {
        return next(new AppError(
            `Cannot delete store. This store is being used by ${purchases.length} purchase record(s). Please delete the purchases first.`, 
            400
        ));
    }

    // Check if the store is being used in Sale model
    const sales = await Sale.find({ store: storeId });
    if (sales.length > 0) {
        return next(new AppError(
            `Cannot delete store. This store is being used by ${sales.length} sale record(s). Please delete the sales first.`, 
            400
        ));
    }

    // Check if the store is being used in Stock model
    const stocks = await Stock.find({ store: storeId });
    if (stocks.length > 0) {
        return next(new AppError(
            `Cannot delete store. This store is being used by ${stocks.length} stock record(s). Please delete the stock records first.`, 
            400
        ));
    }

    // If no dependencies exist, proceed with deletion
    await Store.findByIdAndDelete(storeId);

    res.status(200).json({
        success: true,
        message: "Store deleted successfully",
    });
});