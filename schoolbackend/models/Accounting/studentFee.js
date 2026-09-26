const mongoose = require("mongoose");

const studentFeePaymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Payment amount cannot be negative"],
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountTransaction",
    },
  },
  {
    _id: false,
    timestamps: true,
  }
);

const studentFeeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
      index: true,
    },
    feeType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountingFeeType",
      required: [true, "Fee type is required"],
      index: true,
    },
    academicYear: {
      type: String,
      trim: true,
    },
    term: {
      type: String,
      trim: true,
    },
    amountDue: {
      type: Number,
      required: [true, "Amount due is required"],
      min: [0, "Amount due cannot be negative"],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },
    status: {
      type: String,
      enum: ["pending", "partially_paid", "paid", "cancelled"],
      default: "pending",
      index: true,
    },
    dueDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    payments: [studentFeePaymentSchema],
    lastPaymentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

studentFeeSchema.index({ student: 1, feeType: 1, academicYear: 1 });

module.exports = mongoose.model("StudentFee", studentFeeSchema);

