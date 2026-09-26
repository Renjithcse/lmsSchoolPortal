const mongoose = require('mongoose');
const {auditPlugin} = require('../auditPlugin');
const academicSchema = new mongoose.Schema({
	academicYear: {
		type: String,
		index: true,
		unique: true,
		required: [true, "Please provide an academic year"]
	},
	terms: {
		type: Array,
		required: true,
		validate: {
			validator: function (terms) {
				return terms.length > 0;
			},
			message: 'Please provide at least one term'
		}
	}
}, { timestamps: true });

academicSchema.plugin(auditPlugin);

const AcademicYear = mongoose.model('AcademicYear', academicSchema);

module.exports = AcademicYear;
