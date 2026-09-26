const mongoose = require('mongoose');

const lessonPlanSchema = new mongoose.Schema(
	{
		// Reference to the chapter this lesson plan belongs to
		chapter: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Chapter',
			required: [true, 'Chapter is required'],
		},
		// Order/sequence within the chapter
		order: {
			type: Number,
			default: 0,
			min: 0
		},
		topic: {
			type: String,
			required: [true, 'Lesson topic is required'],
			trim: true,
			maxlength: [200, 'Topic cannot exceed 200 characters'],
		},
		subTopics: [
			{
				type: String,
				trim: true,
			},
		],
		objectives: {
			type: String,
			trim: true,
			maxlength: [2000, 'Objectives cannot exceed 2000 characters'],
		},
		activities: {
			type: String,
			trim: true,
			maxlength: [2000, 'Activities cannot exceed 2000 characters'],
		},
		resources: [
			{
				type: String,
				trim: true,
				maxlength: [500, 'Resource description cannot exceed 500 characters'],
			},
		],
		assessment: {
			type: String,
			trim: true,
			maxlength: [2000, 'Assessment details cannot exceed 2000 characters'],
		},
		notes: {
			type: String,
			trim: true,
			maxlength: [2000, 'Additional notes cannot exceed 2000 characters'],
		},
		status: {
			type: String,
			enum: ['planned', 'in-progress', 'completed'],
			default: 'planned',
		},
		progress: {
			type: Number,
			min: 0,
			max: 100,
			default: 0,
		},
		startDate: {
			type: Date,
		},
		endDate: {
			type: Date,
		},
		completedAt: {
			type: Date,
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		createdByTeacher: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Teacher',
		},
		updatedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		updatedByTeacher: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Teacher',
		},
		tags: [
			{
				type: String,
				trim: true,
			},
		],
		isArchived: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
);

lessonPlanSchema.index({ chapter: 1, order: 1 });

lessonPlanSchema.index({ status: 1, progress: 1 });
lessonPlanSchema.index({ topic: 'text', objectives: 'text', activities: 'text', tags: 'text' });

lessonPlanSchema.pre('save', function preSave(next) {
	if (this.isModified('status')) {
		if (this.status === 'completed') {
			this.progress = 100;
			this.completedAt = this.completedAt || new Date();
		} else if (this.status === 'planned' && this.progress === 100) {
			this.progress = 0;
			this.completedAt = undefined;
		}
	}

	if (this.isModified('progress')) {
		if (this.progress >= 100) {
			this.status = 'completed';
			this.progress = 100;
			this.completedAt = this.completedAt || new Date();
		} else if (this.progress > 0 && this.status === 'planned') {
			this.status = 'in-progress';
		} else if (this.progress === 0 && this.status === 'completed') {
			this.status = 'planned';
			this.completedAt = undefined;
		}
	}

	next();
});

lessonPlanSchema.methods.toPublicObject = function toPublicObject() {
	const plan = this.toObject({ virtuals: true });
	return plan;
};

const LessonPlan = mongoose.model('LessonPlan', lessonPlanSchema);

module.exports = LessonPlan;












