const { Category, SubCategory, Exam } = require('../../models/MarkEntry/Mark');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const Mark = require('../../models/MarkEntry/Mark');
const Student = require('../../models/users/Student');
const AcademicStudent = require('../../models/users/AcademicStudent');
const OnlineExam = require('../../models/OnlineExam/OnlineExam');
const Assignment = require('../../models/Assignments/Assignment');
const Publish = require('../../models/OnlineExam/Publish');
const PublishAssignment = require('../../models/Assignments/Publish');
const GradeSubject = require('../../models/Admin/GradeSubject');
const SubjectPermissions = require('../../models/Admin/SubjectPermissions');

//Get All Categories
exports.getAllCategories = catchAsync(async (req, res, next) => {
    const categories = await Category.find(req?.query);

    res.status(200).json({
        status: 'success',
        results: categories.length,
        data: categories
    });
});


//Add new Category with error message
exports.createCategory = catchAsync(async (req, res, next) => {
    try {

        const { subCategory, academicYear, term, grade, subject, examName } = req.body;
        //Create Sub Category
        const subs= subCategory.map(sub => ({
            ...sub, 
            academicYear, 
            term, 
            grade, 
            subject, 
            examName
        }));

        const subCategories = await SubCategory.insertMany(subs);

        

        req.body.subCategory = subCategories.map(doc => doc._id);


        //Create Student Marks

        const newCategory = await Category.create(req.body);
        res.status(201).json({
            status:'success',
            data: newCategory
        });
    } catch (error) {
        return next(new AppError(error, 400));
    }
});

//Update Category
exports.updateCategory = catchAsync(async (req, res, next) => {
    try {

        const { subCategory, academicYear, term, grade, subject, examName } = req.body;
        //Create Sub Category
        const subs= subCategory.map(sub => ({
            ...sub, 
            academicYear, 
            term, 
            grade, 
            subject, 
            examName
        }));

        const category = await Category.findById(req?.body?.id);

        if(!category) {
            return next(new AppError('No category found with that ID', 404));
        }

        //Remove existing Subcategories
        await SubCategory.deleteMany({_id: {$in: category.subCategory}});

        //Create new Sub Categories
        const subCategories = await SubCategory.insertMany(subs);

        req.body.subCategory = subCategories.map(doc => doc._id);

        const updatedCategory = await Category.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});
        if(!updatedCategory) return next(new AppError('No category found with that ID', 404));
        res.status(200).json({
            status:'success',
            data: updatedCategory
        });

    } catch (error) {
        if(error.name === 'ValidationError') return next(new AppError(error.message, 400));
        return next(error);
    }
});

//Delete Category
exports.deleteCategory = catchAsync(async (req, res, next) => {
    const categoryId = req.params.id;

    // First, check if the category exists
    const category = await Category.findById(categoryId);
    if(!category){
        return next(new AppError('No category found with that ID', 404));
    }

    // Check if the category is being used in Mark model
    const marks = await Mark.find({ category: categoryId });
    if (marks.length > 0) {
        return next(new AppError(
            `Cannot delete category. This category is being used by ${marks.length} mark record(s). Please delete the mark records first.`, 
            400
        ));
    }

    // Check if the category is being used in SubCategory model
    const subCategories = await SubCategory.find({ _id: { $in: category.subCategory } });
    if (subCategories.length > 0) {
        return next(new AppError(
            `Cannot delete category. This category is being used by ${subCategories.length} sub-category record(s). Please delete the sub-categories first.`, 
            400
        ));
    }
    // Then delete the category
    await Category.findByIdAndDelete(categoryId);

    res.status(204).json({
        status:'success',
        data: null
    });
});

//Confirm Category by changing status to active based on academicYear, grade, term, subject, examName
exports.confirmCategory = catchAsync(async (req, res, next) => {
    try {

        const { academicYear, grade, term, subject, examName } = req.body;

        // Check if the exam date allows mark entry
        if (examName) {
            const exam = await Exam.findById(examName);
            if (!exam) {
                return next(new AppError('Exam not found', 404));
            }

            const currentDate = new Date();
            const examDate = new Date(exam.examDate);

            // If exam date is in the future, return warning
            if (examDate > currentDate) {
                return res.status(200).json({
                    status: 'warning',
                    message: 'Exam date is in the future. Mark entry is not allowed for this exam.',
                    data: {
                        mode: 'examDatePassed',
                        examName: exam.examName,
                        examDate: exam.examDate,
                        currentDate: currentDate,
                        warning: true
                    }
                });
            }
        }

        const category = await Category.updateMany(
            { academicYear, grade, term, examName, subject, examName },
            { status: 'active' },
            { new: true, runValidators: true }
        );

        if(!category) return next(new AppError('No category found with that criteria', 404));

        res.status(200).json({
            status:'success',
            data: category
        });

    } catch (error) {
        if(error.name === 'ValidationError') return next(new AppError(error.message, 400));
        return next(error);
    }
});
