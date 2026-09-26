const mongoose = require("mongoose");

const salaryComponentSchema = new mongoose.Schema(
  {
    salaryType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryType",
      required: [true, "Salary type is required for a component"],
    },
    amount: {
      type: Number,
      required: [true, "Component amount is required"],
      min: [0, "Component amount cannot be negative"],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const teacherSalarySchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: [true, "Teacher reference is required"],
      index: true,
    },
    payrollMonth: {
      type: Number,
      min: 1,
      max: 12,
      required: [true, "Payroll month is required"],
    },
    payrollYear: {
      type: Number,
      required: [true, "Payroll year is required"],
      min: [2000, "Payroll year must be reasonable"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total salary amount is required"],
      min: [0, "Total salary amount cannot be negative"],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },
    components: {
      type: [salaryComponentSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "partially_paid", "paid", "cancelled"],
      default: "pending",
      index: true,
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountTransaction",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

teacherSalarySchema.index({ teacher: 1, payrollYear: 1, payrollMonth: 1 }, { unique: false });

module.exports = mongoose.model("TeacherSalary", teacherSalarySchema);

