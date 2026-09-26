const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    expenseHead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpenseHead",
      required: [true, "Expense head is required"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Expense amount is required"],
      min: [0, "Expense amount cannot be negative"],
    },
    expenseDate: {
      type: Date,
      default: Date.now,
    },
    paidTo: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["recorded", "paid", "cancelled"],
      default: "paid",
      index: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        label: { type: String, trim: true },
        fileUrl: { type: String, trim: true },
      },
    ],
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountTransaction",
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ expenseDate: -1 });

module.exports = mongoose.model("Expense", expenseSchema);

