const mongoose = require("mongoose");

const PurchaseSchema = new mongoose.Schema({
    purchaseCode: {
        type: String,
        required: true,
        unique: true,
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store", // Reference to the Store model
        required: true,
    },
    supplier: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
            },
            unit: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Unit", // Reference to the Unit model
                required: true,
            },
            price: {
                type: Number,
                required: true, // Purchase price
            },
            unitPrice: {
                type: Number,
                required: true, // Unit price for the product
            },
            sellingPrice: {
                type: Number,
                required: true, // Selling price for the product
            }
        },
    ],
}, { timestamps: true });

module.exports = mongoose.model("Purchase", PurchaseSchema);