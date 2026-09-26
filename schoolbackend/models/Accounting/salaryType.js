const mongoose = require("mongoose");

const salaryTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Salary component name is required"],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    defaultAmount: {
      type: Number,
      min: [0, "Default amount cannot be negative"],
    },
    isRecurring: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

salaryTypeSchema.index({ name: 1 });

module.exports = mongoose.model("SalaryType", salaryTypeSchema);

