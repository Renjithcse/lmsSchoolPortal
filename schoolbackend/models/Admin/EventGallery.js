const mongoose = require('mongoose');

const eventGallerySchema = new mongoose.Schema(
	{
		eventName: {
			type: String,
			required: [true, 'Please provide event name'],
			trim: true,
			maxlength: [200, 'Event name is too long'],
		},
		description: {
			type: String,
			trim: true,
			maxlength: [2000, 'Description is too long'],
		},
		eventDate: {
			type: Date,
			required: [true, 'Please provide event date'],
		},
		status: {
			type: String,
			enum: ['Draft', 'Published'],
			default: 'Draft',
		},
		publishOption: {
			type: String,
			enum: ['Publish Now', 'Publish Later'],
			default: 'Publish Now',
		},
		scheduledPublishDate: {
			type: Date,
		},
		publishTo: {
			type: String,
			enum: ['All Teachers', 'All Students', 'Both Teachers and Students', 'Specific Students'],
		},
		// Student-specific targeting
		studentTargeting: {
			academicYear: {
				type: String,
			},
			targetType: {
				type: String,
				enum: ['All Students', 'Gender Wise', 'Grade Wise', 'Grade and Gender Wise', 'Section Wise'],
				default: 'All Students',
			},
			gender: {
				type: String,
				enum: ['Male', 'Female', 'Both'],
				default: 'Both',
			},
			grades: [
				{
					type: String,
				},
			],
			// Single grade for Section Wise targeting
			grade: {
				_id: {
					type: String,
				},
				gradeName: {
					type: String,
				},
			},
			// Section gender for Section Wise targeting
			sectionGender: {
				type: String,
				enum: ['Male', 'Female', 'Both'],
				default: 'Both',
			},
			sections: [
				{
					_id: {
						type: String,
					},
					sectionName: {
						type: String,
					},
					grade: {
						type: String,
					},
					gender: {
						type: String,
					},
				},
			],
		},
		images: [
			{
				url: {
					type: String,
					required: true,
				},
				s3Key: {
					type: String,
					required: true,
				},
			},
		],
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

eventGallerySchema.index({ eventDate: -1, createdAt: -1 }, { name: 'idx_event_gallery_date' });

const EventGallery = mongoose.model('EventGallery', eventGallerySchema);

module.exports = EventGallery;
