const mongoose = require("mongoose");

const StockSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    totalQuantity: {
        type: Number,
        required: true,
        min: 0, // Total quantity across all batches
    },
    unit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Unit", // Reference to the Unit model
        required: true,
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store", // Reference to the Store model
        required: true,
    },
    batches: [
        {
            batchCode: {
                type: String,
                required: true, // Unique identifier for the batch
            },
            totalQuantity: {
                type: Number,
                required: true, // Total quantity in this batch
                min: 0,
            },
            remainingQuantity: {
                type: Number,
                required: true, // Remaining stock for this batch
                min: 0,
            },
            sellingPrice: {
                type: Number,
                required: true, // Selling price for this batch
            },
            purchasePrice: {
                type: Number,
                required: true, // Purchase price for this batch
            },
            createdAt: {
                type: Date,
                default: Date.now, // Batch creation date
            },
        },
    ],
}, { timestamps: true });

module.exports = mongoose.model("Stock", StockSchema);