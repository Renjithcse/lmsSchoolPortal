const Purchase = require("../../models/Inventory/purchase");
const Stock = require("../../models/Inventory/stock");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");

// Create a new purchase
exports.createPurchase = catchAsync(async (req, res, next) => {
    const { purchaseCode, store, supplier, date, totalAmount, products } = req.body;

    // Create the purchase
    const newPurchase = await Purchase.create({
        purchaseCode,
        store,
        supplier,
        date,
        totalAmount,
        products,
    });

    // Update the stock for each product
    for (const product of products) {
        const { productId, quantity, unit, unitPrice, sellingPrice, price } = product;

        // Generate a unique batch code
        const batchCode = `BATCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Find the stock record for the product
        let stock = await Stock.findOne({ productId, unit, store });

        if (!stock) {
            // If no stock record exists, create a new one
            stock = await Stock.create({
                productId,
                store,
                totalQuantity: 0,
                unit,
                batches: [],
            });
        }

        // Add the new batch to the stock
        stock.batches.push({
            batchCode,
            totalQuantity: quantity,
            remainingQuantity: quantity,
            sellingPrice: sellingPrice,
            purchasePrice: unitPrice,
            price: price,
        });

        // Update the total quantity
        stock.totalQuantity += quantity;

        await stock.save();
    }

    res.status(201).json({
        success: true,
        data: newPurchase,
    });
});

// Get all purchases
exports.getAllPurchases = catchAsync(async (req, res, next) => {
    const purchases = await Purchase.find()
        .populate("store") // Populate the store details
        .populate("products.productId")// Populate the product details
        .populate("products.unit"); // Populate the unit details
    res.status(200).json({
        status: "success",
        data: purchases,
    });
});

// Get a single purchase by ID
exports.getPurchaseById = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const purchase = await Purchase.findById(id)
        .populate("store") // Populate the store details
        .populate("products.productId")// Populate the product details
        .populate("products.unit"); // Populate the unit details

    if (!purchase) {
        return next(new AppError("Purchase not found.", 404));
    }

    res.status(200).json({
        status: "success",
        data: purchase,
    });
});

// Delete a purchase
exports.deletePurchase = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const deletedPurchase = await Purchase.findByIdAndDelete(id);

    if (!deletedPurchase) {
        return next(new AppError("Purchase not found.", 404));
    }

    res.status(200).json({
        status: "success",
        message: "Purchase deleted successfully.",
    });
});


exports.updatePurchase = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { purchaseCode, store, supplier, date, totalAmount, products } = req.body;

    const updatedPurchase = await Purchase.findByIdAndUpdate(
        id,
        {
            purchaseCode,
            store,
            supplier,
            date,
            totalAmount,
            products,
        },
        { new: true, runValidators: true }
    )
        .populate("store")
        .populate("products.productId")
        .populate("products.unit");

    if (!updatedPurchase) {
        return next(new AppError("Purchase not found.", 404));
    }

    res.status(200).json({
        status: "success",
        data: updatedPurchase,
    });
});

exports.getAllStocks = catchAsync(async (req, res, next) => {
    const stocks = await Stock.find()
        .populate("productId")
        .populate("store")
        .populate("unit");
    res.status(200).json({
        status: "success",
        data: stocks,
    });
});

