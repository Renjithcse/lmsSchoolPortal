const mongoose = require('mongoose');

// Placeholder for subject feedback (screen requested, behavior can be expanded later)
const subjectFeedbackSchema = new mongoose.Schema(
  {
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: [true, 'Please provide an academic year'],
    },
    academicStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicStudent',
      required: [true, 'Please provide academic student id'],
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Please provide student id'],
    },
    grade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grade',
      required: [true, 'Please provide a grade'],
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: [true, 'Please provide a gender'],
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: [true, 'Please provide a section'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    type: {
      type: String,
      enum: ['feedback', 'discipline'],
      required: [true, 'Please provide type'],
      default: 'feedback',
    },
    feedbackDate: {
      type: Date,
      required: [true, 'Please provide feedback date'],
      default: Date.now,
    },
    feedback: {
      type: String,
      required: [true, 'Please provide feedback'],
      trim: true,
      maxlength: [2000, 'Feedback is too long'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide created by'],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide updated by'],
    },
  },
  { timestamps: true }
);

const SubjectFeedback = mongoose.model('SubjectFeedback', subjectFeedbackSchema);

module.exports = SubjectFeedback;

