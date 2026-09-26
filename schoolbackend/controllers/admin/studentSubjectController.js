const StudentSubject = require('../../models/Admin/StudentSubject');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const GradeSubject = require('../../models/Admin/GradeSubject');
const GroupSubject = require('../../models/Admin/GroupSubject');
const { default: mongoose } = require('mongoose');
const AcademicStudent = require('../../models/users/AcademicStudent');
const OnlineExam = require('../../models/OnlineExam/OnlineExam');
const Assignment = require('../../models/Assignments/Assignment');
const Publish = require('../../models/OnlineExam/Publish');
const PublishAssignment = require('../../models/Assignments/Publish');
const Student = require('../../models/users/Student');
const Teacher = require('../../models/users/Teacher');

exports.getAllStudents = catchAsync(async (req, res, next) => {
    let filters = {};
    if (req.query) {
        filters = { ...req.query, Status: 'active' };
    }

    //Check the subject Type
    
    const subject = await GradeSubject.findOne(filters);

    if (!subject) {
        return next(new AppError('No subject found', 404));
    }
    
    if(subject.type === "group"){ // Check the subject Type
        //Find Group Subject where subjects array have cauurent subject Id
        delete filters.Status

        delete filters.subject
        const groupSubject = await GroupSubject.findOne({ ...filters, subjects : subject?.subject._id    })

        if (!groupSubject) {
            return next(new AppError('No Group Subject found', 404));
        }

        const allSubjects = groupSubject.subjects;

        //Get All  Students from Academic Student based on AcademicYear, grade, gender and section
        const students = await AcademicStudent.find({ academicYear: filters.academicYear, grade:filters.grade, gender:filters.gender, status: 'active', section:filters.section }).populate('studentId', '_id studentName studentID as UserId').select('studentId')

        //Get Only Students Id from Student
        const studentIds = students.map(item => item.studentId._id?.toString());


        

        //Get Registered Students from Student
        const registeredStudents = await StudentSubject.find({ 
            academicYear: filters.academicYear, 
            grade:filters.grade, 
            gender:filters.gender, 
            section:filters.section, 
            subject: subject.subject._id, 
            status: 'active' ,
            studentId: { $in: studentIds },
        }).populate('studentId')

        //Get Group Subject Registeed Students
        const registeredGroupSubjectStudents = await StudentSubject.find({ 
            academicYear: filters.academicYear, 
            grade:filters.grade, 
            gender:filters.gender, 
            section:filters.section, 
            subject: { $in: allSubjects}, 
            status: 'active' ,
            studentId: { $in: studentIds },
        });

        console.log({registeredGroupSubjectStudents})

        // Get Only Student Id from All registered students
        const registeredGroupSubjectStudentsIds = registeredGroupSubjectStudents.map(item => item.studentId?.toString());

        //Get Only Student Id from Unregistered students
        const unregisteredStudentsIds = studentIds.filter(id => !registeredGroupSubjectStudentsIds.includes(id));

        //Get Unregistered Students
        const unregisteredStudents = await AcademicStudent.find({ studentId: { $in: unregisteredStudentsIds } }).populate('studentId', '_id studentName studentID as UserId').select('studentId');

        


        //sent Subject
        res.status(200).json({
            status:'success',
            data: {
                registeredStudents,
                unregisteredStudents,
            },
        });
    }
    else if(subject.type === "optional"){
        //Get All  Students from Academic Student based on AcademicYear, grade, gender and section
        const students = await AcademicStudent.find({ academicYear: filters.academicYear, grade:filters.grade, gender:filters.gender, status: 'active', section:filters.section }).populate('studentId', '_id studentName studentID as UserId').select('studentId')

        //Get Only Student Id from Student
        const studentIds = students.map(item => item.studentId._id?.toString());

        //Get Registered Students from Student
        const registeredStudents = await StudentSubject.find({ 
            academicYear: filters.academicYear, 
            grade:filters.grade, 
            gender:filters.gender, 
            section:filters.section, 
            subject: subject.subject._id, 
            status: 'active',
            studentId: { $in: studentIds },
        }).populate('studentId');

        //Get Only Student Id from registered Students
        const registeredStudentsIds = registeredStudents.map(item => item.studentId?._id.toString());

        //Get Only Student Id from Unregistered students
        const unregisteredStudentsIds = studentIds.filter(id =>!registeredStudentsIds.includes(id));

        //Get Unregistered Students
        const unregisteredStudents = await AcademicStudent.find({ studentId: { $in: unregisteredStudentsIds } }).populate('studentId', '_id studentName studentID as UserId').select('studentId');

        //sent Subject
        res.status(200).json({
            status:'success',
            data: {
                registeredStudents,
                unregisteredStudents,
                registeredStudentsIds
            },
        });
    }
    
});

exports.registerStudents = catchAsync(async (req, res, next) => {
    //create Subject Student entry from request body
    const { studentIds, ...rest } = req.body;

    const studentSubjects = studentIds.map(studentId => ({
        studentId,
       ...rest,
    }));

    //Bulk insert into Subject Student
    await StudentSubject.insertMany(studentSubjects);

    res.status(201).json({
        status:'success',
        data: studentSubjects,
    });
});

//Delete Single Registered Student
exports.deleteStudent = catchAsync(async (req, res, next) => {
    const studentSubjectId = req.params.id;

    // First, check if the student subject exists
    const studentSubject = await StudentSubject.findById(studentSubjectId);
    if (!studentSubject) {
        return next(new AppError('No Student Subject record found with that ID', 404));
    }


    // If no dependencies exist, proceed with deletion
    await StudentSubject.findByIdAndDelete(studentSubjectId);

    res.status(204).json({
        status:'success',
        data: null,
    });
});

