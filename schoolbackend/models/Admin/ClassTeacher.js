const mongoose = require('mongoose');

const classTeacherSchema = new mongoose.Schema(
  {
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: [true, 'Please provide an academic year'],
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
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Please provide a teacher'],
    },
  },
  { timestamps: true }
);

// One class teacher per academicYear + grade + gender + section
classTeacherSchema.index(
  { academicYear: 1, grade: 1, gender: 1, section: 1 },
  { unique: true, name: 'uniq_class_teacher_assignment' }
);

const ClassTeacher = mongoose.model('ClassTeacher', classTeacherSchema);

module.exports = ClassTeacher;

