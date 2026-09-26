const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  gradeName: { type: String, required: [true, 'Grade name is required'], unique: true },
  status: { type: String, required: [true, 'Status is required'] }
}, { timestamps: true });

const Grade = mongoose.model('Grade', gradeSchema);

module.exports = Grade;