const mongoose = require("mongoose");

const StoreSchema = new mongoose.Schema(
    {
        storeName: {
            type: String,
            required: true,
            unique: true,
        },
        location: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const Store = mongoose.model("Store", StoreSchema);
module.exports = Store;