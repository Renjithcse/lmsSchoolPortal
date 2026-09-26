const mongoose = require("mongoose");

const accountTransactionSchema = new mongoose.Schema(
  {
    transactionType: {
      type: String,
      enum: ["FEE_PAYMENT", "SALARY_PAYMENT", "EXPENSE_PAYMENT", "ADJUSTMENT"],
      required: [true, "Transaction type is required"],
      index: true,
    },
    direction: {
      type: String,
      enum: ["credit", "debit"],
      required: [true, "Transaction direction is required"],
    },
    amount: {
      type: Number,
      required: [true, "Transaction amount is required"],
      min: [0, "Transaction amount cannot be negative"],
    },
    transactionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    narration: {
      type: String,
      trim: true,
    },
    studentFee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentFee",
    },
    teacherSalary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherSalary",
    },
    expense: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expense",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

accountTransactionSchema.index({ transactionDate: -1 });

module.exports = mongoose.model("AccountTransaction", accountTransactionSchema);

