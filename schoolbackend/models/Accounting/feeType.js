const mongoose = require("mongoose");

const feeTypeSchema = new mongoose.Schema(
  {
  name: {
    type: String,
    required: [true, "Fee type name is required"],
    trim: true,
  },
    description: {
      type: String,
      trim: true,
    },
    defaultAmount: {
      type: Number,
      min: [0, "Default amount cannot be negative"],
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

feeTypeSchema.index({ name: 1 });
feeTypeSchema.index({ grades: 1 });
feeTypeSchema.index({ genders: 1 });

module.exports = mongoose.model("AccountingFeeType", feeTypeSchema);

