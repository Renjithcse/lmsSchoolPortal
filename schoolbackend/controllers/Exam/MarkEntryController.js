const { StudentMarks, Category, Exam } = require('../../models/MarkEntry/Mark');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const AcademicStudent = require('../../models/users/AcademicStudent');
const { default: mongoose } = require('mongoose');

//Get All Students Marks with all reference populated from category and subCategory mark
exports.getAllStudentMarks = catchAsync(async (req, res, next) => {

    const { academicYear, subject, grade, term, examName, gender, section } = req.query;



    // Find students marks based on the filter and populate the related models also populate the related models
    const studentMarks = await StudentMarks.findOne({
        academicYear,
        subject,
        grade,
        term,
        examName
    });

    if(!studentMarks){
        //Check Category active for the same subject
        const categoryExist = await Category.find({
            subject,
            academicYear,
            term,
            grade,
            examName,
            status: 'active'
        });

        if (categoryExist.length === 0) {
            const category = await Category.find({
                subject,
                academicYear,
                term,
                grade,
                examName
            }).populate('subCategory')

            return res.status(200).json({
                status: 'success',
                data: {
                    mode: 'category',
                    categories: category
                }
            });
        }
        else {
            //Find All Students and get All Categories and Subcategories for this subject
            const category = await Category.find({
                subject,
                academicYear,
                term,
                grade,
                examName,
                status: 'active'
            }).populate('subCategory')

            //get All active students from AcademicStudent model
            const students = await AcademicStudent.find({
                academicYear,
                grade:grade,
                gender:gender,
                section:section,
                status: 'active',
            }).populate('studentId', 'studentName studentID')

            return res.status(200).json({
                status: 'success',
                data: {
                    mode: 'newMarkEntry',
                    students: students,
                    categories: category
                }
            });
        }
    }
    else{
        //Get All active Categories
        const category = await Category.find({
            subject,
            academicYear,
            term,
            grade,
            examName,
            status: 'active'
        }).populate('subCategory')

        //Get All students from AcademicStudent model based on academicYear, grade, gender, section
        const students = await AcademicStudent.find({
            academicYear,
            grade:grade,
            gender:gender,
            section:section,
            status: 'active',
        }).populate('studentId', 'studentName studentID').select('studentId');

        // Map student IDs for filtering
        const studentIds = students.map(item => item.studentId._id); // Adjust based on populated structure

        //Find all marks for this subject
        const studentMarks = await StudentMarks.find({
            academicYear,
            term,
            grade,
            subject,
            examName,
            studentId: { $in: students.map(item => studentIds) }
        })
        .populate({
            path: 'categoryMark.categoryId', // Populates categoryId in categoryMark
            model: 'Category', // Ensure this matches your model name
        })
        .populate({
            path: 'categoryMark.subCategories.subcategoryId', // Populates subcategoryId in subCategories
            model: 'SubCategory', // Ensure this matches your model name
        });


        //Check if any marks are already entered for this subject
        if (studentMarks.length > 0) {

            //merge Students Marks into studentArray
            const studentArray = [];
            students.forEach(student => {
                let checkMarkStored = studentMarks.find(item => item.studentId.toString() === student.studentId._id.toString())

                // if(checkMarkStored){
                //     const formattedMarks = 
                // }

                studentArray.push({
                    _id: student.studentId._id,
                    studentName: student.studentId.studentName,
                    studentId: student.studentId.studentID,
                    categories: checkMarkStored?.categoryMark,
                    studentMark: checkMarkStored?.studentMark,
                    totalMark: checkMarkStored?.mark,
                    status: checkMarkStored?.status
                });
            });

            return res.status(200).json({
                status: 'success',
                data: {
                    mode: 'updateMark',
                    students: studentArray,
                    categories: category
                }
            });
        }
        else{
            //Find All Students and get All Categories and Subcategories for this subject
            const category = await Category.find({
                subject,
                academicYear,
                term,
                grade,
                examName,
                status: 'active'
            }).populate('subCategory')

            //get All active students from AcademicStudent model
            const students = await AcademicStudent.find({
                academicYear,
                grade:grade,
                gender:gender,
                section:section,
                status: 'active',
            }).populate('studentId', 'studentName studentID')

            return res.status(200).json({
                status: 'success',
                data: {
                    mode: 'newMarkEntry',
                    students: students,
                    categories: category
                }
            });
        }
        
    }

    


   
});

//Insert student marks into markEntry Model
exports.insertStudentMarks = catchAsync(async (req, res, next) => {

    if (!req?.body?.marks) {
        return next(new AppError('No data provided', 400));
    }

    const { academicYear, term, grade, subject, examName } = req.body?.marks[0];

    // Check if the exam date allows mark entry
    if (examName) {
        const exam = await Exam.findById(examName);
        if (!exam) {
            return next(new AppError('Exam not found', 404));
        }

        const currentDate = new Date();
        const examDate = new Date(exam.examDate);

        // If exam date is in the future, prevent mark entry
        if (examDate > currentDate) {
            return next(new AppError('Exam date is in the future. Mark entry is not allowed for this exam.', 400));
        }
    }

    //Get all students Id from request
    const studentIds = req.body?.marks.map(item => item.studentId);

    //Remove all records from markEntry based on academicYear, term, grade, subject, examName and array of studentId
    await StudentMarks.deleteMany({
        academicYear,
        term,
        grade,
        subject,
        examName,
        studentId: { $in: studentIds }
    });



    const studentMarks = await StudentMarks.insertMany(req?.body?.marks);

    res.status(201).json({
        status: 'success',
        data: studentMarks
    });



});

