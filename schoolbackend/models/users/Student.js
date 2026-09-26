const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
	studentID: { type: String, required: [true, "Please provide a Student Id"] },
	studentName: { type: String, required: [true, "Please provide a name"] },
	Dob: { type: String, required: [true, "Please provide a date of birth"] },
	grade:{ type: mongoose.Schema.Types.ObjectId, ref: 'Grade', required: [true, "Please provide a grade"] },
	gender:{ type: String, required: [true, "Please provide a gender"], enum: ['male', 'female'] },
	section:{ 
		type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: [true, 'Please provide a section']
	},
	Father_name: { type: String, required: [true, "Please provide a Father Name"] },
	Mother_name: { type: String, required: [true, "Please provide a Mother Name"] },
	contactNo: { type: String, required: [true, "Please provide a contact number"] },
	Communication_no: { type: String, required: [true, "Please provide a Communication number"] },
	academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: [true, "Please provide an academic year"] },
	// Optional Fields
	Admission_date: { type: Date },
	Religion: { type: mongoose.Schema.Types.ObjectId, ref: 'Religion' },
	Email: { type: String },
	Place_of_birth: { type: String },
	City: { type: Number, ref: 'City' },
	Zip: { type: String },
	Communication_Address: { type: String },
	Permanent_Address: { type: String },
	Nationality: { type: Number, ref: 'Country' },
	Province: { type: Number, ref: 'State' },
	Previous_School: { type: String },
	Hobbies: { type: String },
	Health_Issue: { type: String },
	Passport_No: { type: String },
	Passport_Expiry: { type: Date },
	Iqama_No: { type: String },
	Iqama_Expiry: { type: Date },
	Transport_Pickup: { type: String, enum: ['School Bus', 'Parents'] },
	Pickup_BusNo: { type: String },
	Transport_Drop: { type: String, enum: ['School Bus', 'Parents'] },
	Drop_BusNo: { type: String },
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	role: { type: mongoose.Schema.Types.ObjectId, ref: 'Roles' },
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;