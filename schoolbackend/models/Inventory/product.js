const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  productCategory: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryCategory", required: true },
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: "InventorySubCategory", required: true },
  productStatus: { type: String, enum: ["In Stock", "Low Stock", "Out of Stock"], required: true },
  productCode: { type: String, required: true, unique: true },
  primaryImage: { type: String }, // S3 URL to the primary image
  primaryImageS3Key: { type: String }, // S3 key for deletion
  otherImages: [{ type: String }], // S3 URLs to other images
  otherImagesS3Keys: [{ type: String }], // S3 keys for deletion
  author: { type: String },
  publisher: { type: String },
  publishedYear: { type: Number, min: 1900, max: new Date().getFullYear() },
  isbn: { type: String },
});

module.exports = mongoose.model("Product", ProductSchema);