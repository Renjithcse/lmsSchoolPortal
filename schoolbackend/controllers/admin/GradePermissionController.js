const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const GradePermissions = require('../../models/Admin/GradePermissions');
const SubjectPermissions = require('../../models/Admin/SubjectPermissions');
const Settings = require('../../models/Admin/Settings');
const Grade = require('../../models/Admin/Grade');
const Section = require('../../models/Admin/Section');
const Teacher = require('../../models/users/Teacher');
const GradeSubject = require('../../models/Admin/GradeSubject');

//Get All Grade Permissions
exports.getAllGradePermissions = catchAsync(async (req, res, next) => {

    //Get Current Academic Year from Settings
    const currentAcademicYear = await Settings.findOne();

    if(!currentAcademicYear){
        return next(new AppError("No current academic year found in settings", 404));
    }

    //Filter Grade Permissions by Academic Year and teacher Id

    const gradePermissions = await GradePermissions.find({ academicYear: currentAcademicYear?.academicYear, teacherId: req?.params?.id}).populate('grade', 'gradeName');

    if(!gradePermissions){
        return next(new AppError("No grade permissions found for this teacher", 404));
    }

    res.status(200).json({
        status: "success",
        data: gradePermissions
    });
});

//Get Logged In teacher Grades
exports.getLoggedInTeacherGrades = catchAsync(async (req, res, next) => {
    if(!req?.query?.academicYear){
        const currentAcademicYear = await Settings.findOne();

        if(!currentAcademicYear){
            return next(new AppError("No current academic year found in settings", 404));
        }

        req.query.academicYear = currentAcademicYear?.academicYear
    }
    // Get Current Academic Year from Settings
    // const currentAcademicYear = await Setting.findOne();

    // if(!currentAcademicYear){
    //     return next(new AppError("No current academic year found in settings", 404));
    // }

    //Check if user is admin
    if(req?.user?.role === "admin"){
        //Get All Subjects from Grade  Model
        let grades = await Grade.find({ status: "Active" });

        
        res.status(200).json({
            status: "success",
            data: grades
        });

        
    }
    else {
        //Check Grade Permissions If any Permissions Registered
        //Find Teacher Id for the user
        const teacher = await Teacher.findOne({ userId: req?.user?._id });
        if(!teacher) {
            return next(new AppError("No teacher found for this user", 404));
        }
        let gradePermissions = await GradePermissions.find({ academicYear: req?.query?.academicYear, teacherId: teacher?._id}).populate('grade', 'gradeName');

        if(gradePermissions?.length > 0){
            let grades = gradePermissions?.map(grade => grade.grade)
            res.status(200).json({
                status: "success",
                data: grades
            });
        }
        else{
            //No Permisions Registered. Check Grade Subject whether teacher allocated
            let gradeSubject = await GradeSubject.distinct('grade', { academicYear: req?.query?.academicYear, teacher: teacher?._id, Status: 'active' });

            let allGrades = gradeSubject?.map(grade => grade)


            let Grades = await Grade.find({ _id: { $in: allGrades } })


            res.status(200).json({
                status: "success",
                data: Grades
            });

        }
    }
});

//Get LoggedIn Teacher Gender
exports.getLoggedInTeacherGender = catchAsync(async (req, res, next) => {
    // Get Current Academic Year from Settings
    let academicYear;

    if(!req?.query?.academicYear){
        const currentAcademicYear = await Settings.findOne();

        if(!currentAcademicYear){
            return next(new AppError("No current academic year found in settings", 404));
        }

        academicYear = currentAcademicYear?.academicYear
    }
    else{
        academicYear = req?.query?.academicYear
    }
    

    //Check if user is admin
    if(req?.user?.role === "admin"){

        
        res.status(200).json({
            status: "success",
            data: ["male", "female"]
        });

        
    }
    else {
        //Check Grade Permissions If any Permissions Registered
        //Find Teacher Id for the user
        const teacher = await Teacher.findOne({ userId: req?.user?._id });
        // console.log(teacher);
        if(!teacher) {
            return next(new AppError("No teacher found for this user", 404));
        }
        
        let gradePermissions = await GradePermissions.findOne({ academicYear: academicYear, grade: req?.query?.grade, teacherId: teacher?._id});

        


        if(gradePermissions){
            res.status(200).json({
                status: "success",
                data: gradePermissions?.gender
            });
        }
        else{
            const filters = { 
                academicYear: academicYear, 
                teacher: teacher?._id, 
                grade: req?.query?.grade, 
                Status: 'active' 
            }
            //No Permisions Registered. Check Grade Subject whether teacher allocated
            let gradeGender = await GradeSubject.distinct('gender', filters);

            

            res.status(200).json({
                status: "success",
                data: gradeGender
            });

        }
    }
})

//Get LoggedIn Teacher Gender
exports.getLoggedInTeacherSection = catchAsync(async (req, res, next) => {
    // Get Current Academic Year from Settings
    let academicYear;

    if(!req?.query?.academicYear){
        const currentAcademicYear = await Settings.findOne();

        if(!currentAcademicYear){
            return next(new AppError("No current academic year found in settings", 404));
        }

        academicYear = currentAcademicYear?.academicYear
    }
    else{
        academicYear = req?.query?.academicYear
    }

    //Check if user is admin
    if(req?.user?.role === "admin"){

        const Sections = await Section.find({ status : 'active' });
        
        res.status(200).json({
            status: "success",
            data: Sections
        });

        
    }
    else {
        //Check Grade Permissions If any Permissions Registered
        //Find Teacher Id for the user
        const teacher = await Teacher.findOne({ userId: req?.user?._id });
        if(!teacher) {
            return next(new AppError("No teacher found for this user", 404));
        }
        let subjectPer = await SubjectPermissions.find({ academicYear: academicYear, grade: req?.query?.grade, gender: req?.query?.gender, teacher: teacher?._id}).populate("section", "sectionName");

        let sections = subjectPer?.map(sub => sub.section)


        if(subjectPer?.length > 0){
            res.status(200).json({
                status: "success",
                data: sections
            });
        }
        else{
            const filters = { 
                academicYear: academicYear, 
                teacher: teacher?._id, 
                grade: req?.query?.grade, 
                gender: req?.query?.gender,
                Status: 'active' 
            }
            //No Permisions Registered. Check Grade Subject whether teacher allocated
            let gradeSection = await GradeSubject.distinct('section', filters);


            let allSections = gradeSection?.map(sec => sec)



            let Sections = await Section.find({ _id: { $in: allSections } })

            

            res.status(200).json({
                status: "success",
                data: Sections
            });

        }
    }
})

//Update a Grade Permission
exports.updateGradePermission = catchAsync(async (req, res, next) => {

    const { teacherId, grades } = req?.body;

    // Get Current Academic Year from Settings
    const currentAcademicYear = await Settings.findOne();

    if(!currentAcademicYear){
        return next(new AppError("No current academic year found in settings", 404));
    }



    //Delete all entries based on Teacher Id
    await GradePermissions.deleteMany({ teacherId: teacherId, academicYear: currentAcademicYear?.academicYear });

    //Create new Grade Permissions
    if(grades && grades.length > 0){
        grades.forEach(grade => {
            grade.teacherId = teacherId;
            grade.academicYear = currentAcademicYear?.academicYear;
            grade.createdBy = req?.user?._id
            GradePermissions.create(grade);
        });
    
        res.status(200).json({
            status: "success",
            message: "Grade permissions updated successfully"
        });
    }
    else{
        res.status(200).json({
            status: "success",
            message: "No grade permissions found to update"
        });
    }
   
});


