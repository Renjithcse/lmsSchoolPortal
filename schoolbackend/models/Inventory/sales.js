const mongoose = require("mongoose");

const SaleSchema = new mongoose.Schema({
    saleCode: {
        type: String,
        unique: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    userRole: {
        type: String,
        enum: ["student", "teacher"],
        required: true,
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    products: [
        {
            batchCode: {
                type: String,
                required: true,
            },
            purchasePrice: {
                type: Number,
                required: true,
            },
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
                ref: "Unit",
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
            unitPrice: {
                type: Number,
                required: true,
            },
        },
    ],
}, { timestamps: true });

// Auto-generate saleCode before saving if not present
SaleSchema.pre("save", async function (next) {
    if (!this.saleCode) {
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const random = Math.floor(1000 + Math.random() * 9000);
        this.saleCode = `SAL-${yyyy}${mm}${dd}-${random}`;
    }
    next();
});

module.exports = mongoose.model("Sale", SaleSchema);