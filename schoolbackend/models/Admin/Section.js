const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
    sectionName: { type: String, required: [true, 'Section name is required'] },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Section = mongoose.model('Section', sectionSchema);

module.exports = Section;
