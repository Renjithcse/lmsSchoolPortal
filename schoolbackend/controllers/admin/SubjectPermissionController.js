const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const SubjectPermissions = require('../../models/Admin/SubjectPermissions');
const Setting = require('../../models/Admin/Settings');
const { default: mongoose } = require("mongoose");
const Settings = require("../../models/Admin/Settings");
const GradeSubject = require("../../models/Admin/GradeSubject");
const Subject = require("../../models/Admin/Subject");
const Teacher = require("../../models/users/Teacher");

//Get All Grade Permissions
exports.getAllSubjectPermissions = catchAsync(async (req, res, next) => {

    //Get Current Academic Year from Settings
    const currentAcademicYear = await Setting.findOne();

    if(!currentAcademicYear){
        return next(new AppError("No current academic year found in settings", 404));
    }

    //Filter Grade Permissions by Academic Year and teacher Id

    const filters = { academicYear: currentAcademicYear?.academicYear, teacher: new mongoose.Types.ObjectId(req?.params?.id)}


    const subjectPermissions = await SubjectPermissions.find(filters).populate("academicYear", "academicYear").populate("grade", "gradeName").populate("section", "sectionName").populate("subjects", "subjectName");

    // if(subjectPermissions?.length === 0){
    //     return next(new AppError("No Subject permissions found for this teacher", 404));
    // }

    res.status(200).json({
        status: "success",
        data: subjectPermissions
    });
});

exports.getMySubjectPermissions = catchAsync(async (req, res, next) => {
    if(!req?.query?.academicYear){
        const currentAcademicYear = await Settings.findOne();

        if(!currentAcademicYear){
            return next(new AppError("No current academic year found in settings", 404));
        }

        req.query.academicYear = currentAcademicYear?.academicYear
    }

    if(req?.user?.role === "admin"){
        //Get All Subjects from Grade  Model
        let subjectArray = await GradeSubject.distinct('subject', { ...req?.query, Status: "active" });

        const SUbjects = await Subject.find({ _id: { $in : subjectArray}})
        
        res.status(200).json({
            status: "success",
            data: SUbjects
        });

        
    }
    else{
        const teacher = await Teacher.findOne({ userId: req?.user?._id });
        if(!teacher) {
            return next(new AppError("No teacher found for this user", 404));
        }

        const SubjectPer = await SubjectPermissions.find({ ...req?.query, teacher: teacher?._id }).select('subjects');

        if(SubjectPer?.length > 0) {

            const mergedSubjects = SubjectPer.flatMap(item => item.subjects);

            //Remove Duplicates
            const uniqe = [...new Set(mergedSubjects)];

            //Find Subjects by their Id
            const SUbjects = await Subject.find({ _id: { $in : uniqe}})
            
            res.status(200).json({
                status: "success",
                data: SUbjects
            });
        }
        else{
            //Check Subject Allocated for the teacher
            const AllocatedSubjects = await GradeSubject.find({ ...req?.query, teacher: teacher?._id})

            const SubjectArray = AllocatedSubjects?.map((Subject) => Subject?.subject);

            const uniqueSubjects = new Set(SubjectArray)

            //Find Subjects by their Id
            const SUbjects = await Subject.find({ _id: { $in : [...uniqueSubjects]}})
            
            res.status(200).json({
                status: "success",
                data: SUbjects
            });
        }

    }
})

//Create Subject Permissions
exports.createSubjectPermission = catchAsync(async (req, res, next) => {

    //Get Current Academic Year from Settings
    const currentAcademicYear = await Setting.findOne();

    if(!currentAcademicYear){
        return next(new AppError("No current academic year found in settings", 404));
    }

    const { grade, gender, section, subjects, teacher } = req.body;

    //Check existing permission is there. If there means append subject
    const existingPermission = await SubjectPermissions.findOne({ grade, gender, section, teacher, academicYear: currentAcademicYear?.academicYear });

    if(existingPermission){
        existingPermission.subjects = [...existingPermission.subjects,...subjects];
        await existingPermission.save();
        return res.status(200).json({
            status: "success",
            data: existingPermission
        });
    }

    //If no permission is there, create new permission
    const subjectPermission = new SubjectPermissions({
        academicYear: currentAcademicYear?.academicYear,
        grade,
        gender,
        section,
        subjects,
        teacher,
        createdBy: req?.user?._id
    });

    await subjectPermission.save();

    res.status(201).json({
        status: "success",
        data: subjectPermission
    });
    

});

//Update Subject Permissions
exports.updateSubjectPermission = catchAsync(async (req, res, next) => {

    //Get Current Academic Year from Settings
    const currentAcademicYear = await Setting.findOne();

    if(!currentAcademicYear){
        return next(new AppError("No current academic year found in settings", 404));
    }

    const { subjects } = req.body;

    //Update Subject Permissions based on id
    const updatedSubjectPermissions = await SubjectPermissions.findByIdAndUpdate(req?.params?.id, { subjects }, { new: true });

    if(!updatedSubjectPermissions){
        return next(new AppError("No subject permissions found for this id", 404));
    }

    res.status(200).json({
        status: "success",
        data: updatedSubjectPermissions
    });

    
})

// Get all GradeSubject records
exports.getGradeSubjects = catchAsync(async (req, res, next) => {
    let filters = structuredClone(req?.query)
    if(!req?.query?.academicYear){
        const currentAcademicYear = await Settings.findOne();

        if(!currentAcademicYear){
            return next(new AppError("No current academic year found in settings", 404));
        }

        filters.academicYear = currentAcademicYear?.academicYear;
    }

    delete filters.teacher

    //Get All Grade Subjects
    let gradeSubjects = await GradeSubject.find(filters)
        .populate('subject', 'subjectName')

    //Get Already Permitted Subjects
    const alreadyPermittedSubjects = await SubjectPermissions.findOne({
        ...req?.query
    })

    if(alreadyPermittedSubjects){
        const permittedSubjects = alreadyPermittedSubjects.subjects;
        //Filter Grade Subjects by Already Permitted Subjects
        gradeSubjects = gradeSubjects.filter(subject =>!permittedSubjects.includes(subject?.subject?._id));
    }

    

    


    res.status(200).json({
        status: 'success',
        results: gradeSubjects.length,
        data: gradeSubjects
    });
});

//Delete Subject Permissions
exports.deleteSubjectPermission = catchAsync(async (req, res, next) => {


    //Delete Subject Permissions based on id
    const deletedSubjectPermissions = await SubjectPermissions.findByIdAndDelete(req?.params?.id);

    if(!deletedSubjectPermissions){
        return next(new AppError("No subject permissions found for this id", 404));
    }

    res.status(204).json({
        status: "success",
        data: null
    });

    
})
