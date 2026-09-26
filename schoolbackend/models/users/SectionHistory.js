const mongoose = require('mongoose');

const sectionHistorySchema = new mongoose.Schema({
    academicYear: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'AcademicYear', 
        required: [true, "Please provide an academic year"] 
    },
    section:{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: [true, 'Please provide a section']
    },
    studentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Student', 
        required: [true, "Please provide a student ID"] 
    },
    startDate: { 
        type: Date, 
        required: [true, "Please provide a start date"],
        default: Date.now
    },
    endDate: { 
        type: Date 
    },
}, { timestamps: true });

const SectionHistory = mongoose.model('SectionHistory', sectionHistorySchema);

module.exports = SectionHistory;
