const mongoose = require("mongoose");

const expenseHeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Expense head name is required"],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
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

expenseHeadSchema.index({ name: 1 });

module.exports = mongoose.model("ExpenseHead", expenseHeadSchema);

