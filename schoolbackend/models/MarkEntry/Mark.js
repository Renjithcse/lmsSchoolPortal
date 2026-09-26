const mongoose = require('mongoose');
const { default: slugify } = require('slugify');

const ExamSchema = new mongoose.Schema({
    academicYear: {
        type: mongoose.Schema.ObjectId,
        ref: 'AcademicYear',
        required: [true, 'Academic Year is required'],
    },
    term: {
        type: String,
        required: [true, 'Term is required'],
    },
    examName: {
        type: String,
        required: [true, 'Exam Name is required'],
    },
    examDate: {
        type: Date,
        required: [true, 'Exam Date is required'],
    },
    publishDate: {
        type: Date,
        required: [true, 'Publish Date is required'],
    },
    slug: {
        type: String,
        unique: true,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
}, {
    timestamps: true,
})

// Subcategory Schema
const SubCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    mark: {
        type: Number,
        required: true,
        min: 0,
    },
    academicYear: {
        type: mongoose.Schema.ObjectId,
        ref: 'AcademicYear',
        required: [true, 'Academic Year is required'],
    },
    term: {
        type: String,
        required: true,
    },
    grade:{
        type: mongoose.Schema.ObjectId,
        ref: 'Grade',
        required: [true, 'Grade is required'],
    },
    subject: {
        type: mongoose.Schema.ObjectId,
        ref: 'Subject',
        required: [true, 'Subject is required'],
    },
    examName: {
        type: mongoose.Schema.ObjectId,
        ref: 'Exam',
    },
});

// Category Schema
const CategorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
        trim: true,
    },
    mark: {
        type: Number,
        required: true,
        min: 0,
    },
    academicYear: {
        type: mongoose.Schema.ObjectId,
        ref: 'AcademicYear',
        required: [true, 'Academic Year is required'],
    },
    term: {
        type: String,
        required: true,
    },
    grade:{
        type: mongoose.Schema.ObjectId,
        ref: 'Grade',
        required: [true, 'Grade is required'],
    },
    subject: {
        type: mongoose.Schema.ObjectId,
        ref: 'Subject',
        required: [true, 'Subject is required'],
    },
    examName: {
        type: String,
        required: true,
    },
    subCategory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubCategory',
        },
    ],
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive',
    }
});

// Student Marks Schema
const StudentMarksSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Student',
        required: [true, 'Student Id is required'],
    },
    academicYear: {
        type: mongoose.Schema.ObjectId,
        ref: 'AcademicYear',
        required: [true, 'Academic Year is required'],
    },
    term: {
        type: String,
        required: true,
    },
    grade:{
        type: mongoose.Schema.ObjectId,
        ref: 'Grade',
        required: [true, 'Grade is required'],
    },
    subject: {
        type: mongoose.Schema.ObjectId,
        ref: 'Subject',
        required: [true, 'Subject is required'],
    },
    examName: {
        type: mongoose.Schema.ObjectId,
        ref: 'Exam',
    },
    categoryMark: [
        {
            categoryId:  {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Category',
            },
            mark: {
                type: Number,
                required: true,
                min: 0,
            },
            studentMark: {
                type: Number,
                min: 0,
            },
            subCategories: [
                {
                    subcategoryId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'SubCategory',
                    },
                    mark: {
                        type: Number,
                        required: true,
                        min: 0,
                    },
                    studentMark: {
                        type: Number,
                        min: 0,
                    }
                }
            ]
        }
       
    ],
    mark: {
        type: Number,
        required: true,
        min: 0,
    },
    studentMark: {
        type: Number,
        min: 0,
    },
    status: {
        type: String,
        enum: ['present', 'absent'],
        default: 'present',
    }
}, { timestamps: true });

// Create a unique index for examName, academicYear, grade, term, and subjectId combination
ExamSchema.index({ academicYear: 1, term: 1, slug: 1, status: 1 }, { unique: true });

// Pre-save middleware to create slug before saving
ExamSchema.pre('save', function (next) {
    if (!this.isModified('examName')) {
        return next();
    }

    // Generate slug using slugify
    this.slug = slugify(this.examName, { lower: true, strict: true });
    next();
});

const Exam = mongoose.model('Exam', ExamSchema);
const SubCategory = mongoose.model('SubCategory', SubCategorySchema);
const Category = mongoose.model('Category', CategorySchema);
const StudentMarks = mongoose.model('StudentMarks', StudentMarksSchema);

module.exports = { SubCategory, Category, StudentMarks, Exam };
