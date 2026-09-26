const mongoose = require("mongoose");

const InventorySubCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryCategory", required: true },
  description: { type: String },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("InventorySubCategory", InventorySubCategorySchema);