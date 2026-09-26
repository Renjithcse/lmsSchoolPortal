const mongoose = require('mongoose');
const crypto = require("crypto");


const teacherSchema = new mongoose.Schema({
    employeeName: { type: String, required: [true, "Please provide the employee name"] },
    employeeId: { type: String, required: [true, "Please provide the employee ID"], unique: true },
    contactNo: { type: String, required: [true, "Please provide a contact number"] },
    email: { type: String, required: [true, "Please provide an email"], unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Roles' },
    profilePicture: { type: String },
    designation: { type: String },
    qualification: { type: String },
    alternativeNumber: { type: String },
    dob: { type: Date },
    gender:{ type: String, enum: ['male', 'female', 'other'] },
    Religion: { type: mongoose.Schema.Types.ObjectId, ref: 'Religion' },
    dateOfJoining: { type: Date },
    experienceInYears: { type: Number },
    place: { type: String },
    City: { type: Number, ref: 'City' },
    zip: { type: String },
    Province: { type: Number, ref: 'State' },
    communicationAddress: { type: String },
    permanentAddress: { type: String },
    nationality: { type: Number, ref: 'Country' },
    passportNo: { type: String },
    passportExpiry: { type: Date },
    iqamaNo: { type: String },
    iqamaExpiry: { type: Date },
    verificationCode: String,
    verificationCodeExpires: Date,
    verificationCodeChecked: Boolean,
    validateBeforeSave: Boolean,
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    }
}, { timestamps: true });

teacherSchema.methods.createVerificationCodeTeacher = function (type) {
  const bytes = type === "link" ? 32 : 3;
  const code = crypto.randomBytes(bytes).toString("hex");

  this.verificationCode = crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");

  this.verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 min
  return code;
};

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;
