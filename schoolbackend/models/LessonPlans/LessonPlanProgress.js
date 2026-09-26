const mongoose = require('mongoose');

const lessonPlanProgressSchema = new mongoose.Schema(
	{
		lessonPlan: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'LessonPlan',
			required: [true, 'Lesson plan reference is required'],
		},
		publishedChapter: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'PublishedChapter',
			required: [true, 'Published chapter reference is required'],
		},
		progress: {
			type: Number,
			min: 0,
			max: 100,
			default: 0,
		},
		status: {
			type: String,
			enum: ['planned', 'in-progress', 'completed'],
			default: 'planned',
		},
		notes: {
			type: String,
			trim: true,
		},
		updatedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
	},
	{
		timestamps: true,
	}
);

lessonPlanProgressSchema.index(
	{ lessonPlan: 1, publishedChapter: 1 },
	{ unique: true, name: 'lessonPlanPublishedChapterIndex' }
);

lessonPlanProgressSchema.pre('save', function preSave(next) {
	if (this.isModified('progress')) {
		if (this.progress >= 100) {
			this.status = 'completed';
			this.progress = 100;
		} else if (this.progress > 0) {
			this.status = 'in-progress';
		} else {
			this.status = 'planned';
		}
	}
	next();
});

const LessonPlanProgress = mongoose.model('LessonPlanProgress', lessonPlanProgressSchema);

module.exports = LessonPlanProgress;
