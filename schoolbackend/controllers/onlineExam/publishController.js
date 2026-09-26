const Publish = require('../../models/OnlineExam/Publish');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const OnlineExam = require('../../models/OnlineExam/OnlineExam');
const AcademicStudent = require('../../models/users/AcademicStudent');
const StudentExamAttempt = require('../../models/OnlineExam/StudentExamAttempt');
const StudentPerformance = require('../../models/OnlineExam/StudentPerformance');
const Question = require('../../models/OnlineExam/Question');
const Section = require('../../models/Admin/Section');
const Teacher = require('../../models/users/Teacher');
const SubjectPermissions = require('../../models/Admin/SubjectPermissions');
const GradeSubject = require('../../models/Admin/GradeSubject');



exports.createPublish = catchAsync(async (req, res, next) => {
    const { exam, questionBank, gender, sections, numberOfQuestions, duration, startDate, endDate } = req.body;

    let publishedExams = [];

    // Fetch the exam to get the grade
    const examData = await OnlineExam.findById(exam);
    if (!examData) {
        return next(new AppError('No exam found with that ID', 404));
    }

    const grade = examData.grade;

    let results = await Promise.all(sections?.map(async sec => {
        const isPublished = await Publish.findOne({ exam, questionBank, grade, gender, section:sec });
        if (isPublished) {
            throw new AppError('Exam already published for the given section', 400);
        }

        const totalQuestionsInBank = await Question.find({ questionBank }).countDocuments();
        let students = await AcademicStudent.find({
            academicYear: examData.academicYear,
            grade:grade,
            gender:gender,
            section:sec,
            status: 'active',
        }).select('studentId');

        if (!students || students.length === 0) {
            let sectionDetails = await Section.findById(sec);

            throw new AppError(`No students are found in ${sectionDetails?.sectionName}`, 404);
        }
        
        let newPublish = await Publish.create({
            exam,
            questionBank,
            gender,
            section:sec,
            numberOfQuestions,
            totalQuestionsInBank,
            duration,
            startDate,
            endDate,
            totalUsersSelected: students.length,
            grade,
            createdBy: req.user.id
        });

        const attemptsToCreate = students.map(student => ({
            studentId: student.studentId,  
            publishId: newPublish?._id, 
            totalQuestions: numberOfQuestions,  
        }));

        let perFormanceArray = []

        students.map(async (student) => {
            // studentId: student.studentId,
            // examId: exam
            let existin = await StudentPerformance.findOne({ studentId: student.studentId, examId: exam});

            if(!existin) {
                perFormanceArray?.push({ studentId: student.studentId, examId: exam})
            }
        });

        await StudentExamAttempt.insertMany(attemptsToCreate);
        if(perFormanceArray?.length){
            await StudentPerformance.insertMany(perFormanceArray);
        }
        

        publishedExams = await Publish.find({ exam });
    }));

    res.status(201).json({
        status: 'success',
        data: {
            publishedExams,
        },
    });
});


//Create new Publish with Existing publishId and selected students
exports.createPublishWithSelectedStudents = catchAsync(async (req, res, next) => {

    const { publishId, questionBank,  numberOfQuestions, duration, startDate, endDate, selectedStudents } = req.body;

    if (!publishId) {
        return next(new AppError('Please provide a publish ID', 400));
    }

    if (!selectedStudents || selectedStudents.length === 0) {
        return next(new AppError('Please provide selected students', 400));
    }

    const publish = await Publish.findById(publishId);


    if (!publish) {
        return next(new AppError('No publish found with that ID', 404));
    }

    const totalQuestionsInBank = await Question.find({ questionBank }).countDocuments();

    let newPublish = await Publish.create({
        exam: publish?.exam,
        questionBank,
        gender:publish?.gender,
        section:publish?.section,
        numberOfQuestions,
        totalQuestionsInBank,
        duration,
        startDate,
        endDate,
        totalUsersSelected: selectedStudents.length,
        grade:publish?.grade,
        createdBy: req.user.id
    });

    let attempCreate = [];
    let performanceToAdd = [];
    await Promise.all(selectedStudents?.map(async student => {
            attempCreate.push({
                studentId: student.studentId._id,  
                publishId: newPublish?._id, 
                totalQuestions: numberOfQuestions,
            })

            //Check Entry exists in studentPerformance Schema
            const performanceCheck = await StudentPerformance.findOne({ studentId: student.studentId._id, examId: publish?.exam });
            if(!performanceCheck){
                performanceToAdd.push({
                    studentId: student.studentId._id,
                    examId: publish?.exam,
                });
            }


        })
    );

    await StudentExamAttempt.insertMany(attempCreate);
    await StudentPerformance.insertMany(performanceToAdd);

    res.status(201).json({
        status:'success',
        data: {
            publish,
        },
    });
});




// Get all published exams based on examId
exports.getAllPublishedExamsByExamId = catchAsync(async (req, res, next) => {
    const { slug } = req.query;


    

    //Find Exam By slug
    const exam = await OnlineExam.findOne({ slug : slug });


    if(!exam){
        //return no exam error
        return next(new AppError('No exam found with that slug', 404));
    }

    //Check user Role If admin get All Published Exams
    if(req?.user?.role === "admin"){
        const publishedExams = await Publish.find({ exam: exam?._id })
            .populate({
                path: 'exam',
                select: '_id examName subjectId',
                populate: {
                    path: 'subjectId',
                    select: 'subjectName'
                }
            })
            .populate({
                path: 'questionBank',
                select: '_id questionBankName subject',
                populate: {
                    path: 'subject',
                    select: 'subjectName'
                }
            })
            .populate('section', '_id sectionName')
            .populate('grade', '_id gradeName');
        res.status(200).json({
            status:'success',
            results: publishedExams.length,
            data: publishedExams,
            publishCount: publishedExams.length,
        });
    }
    else{  
        //Get Permitted Gender and Section
        const teacher = await Teacher.findOne({ userId: req?.user?._id });
        if(!teacher) {
            return next(new AppError("No teacher found for this user", 404));
        }
        let subjectPer = await SubjectPermissions.find({ academicYear: exam?.academicYear, grade: exam?.grade, teacher: teacher?._id});

        if(subjectPer?.length > 0){
            let sections = [];
            let genders = [];

            subjectPer.forEach(sub => {
                sections.push(sub.section);
                genders.push(sub.gender);
            });

            const uniquSections = new Set(sections);
            const uniquGenders = new Set(genders);

            const publishedExams = await Publish.find({
                exam: exam?._id,
                section: { $in: [...uniquSections] },
                gender: { $in: [...uniquGenders] }
            })
                .populate({
                    path: 'exam',
                    select: '_id examName subjectId',
                    populate: {
                        path: 'subjectId',
                        select: 'subjectName'
                    }
                })
                .populate('section', '_id sectionName')
                .populate({
                    path: 'questionBank',
                    select: '_id questionBankName subject',
                    populate: {
                        path: 'subject',
                        select: 'subjectName'
                    }
                })
                .populate('grade', '_id gradeName');

            res.status(200).json({
                status:'success',
                results: publishedExams.length,
                data: publishedExams,
                publishCount: publishedExams.length,
            });

        }
        else{
            //Check Grade Subject Teacher Allocated Subjects
            const gradeSubjects = await GradeSubject.find({ academicYear: exam?.academicYear, grade: exam?.grade, teacher: teacher?._id, Status: 'active' });

            if(!gradeSubjects.length){
                return next(new AppError('No subject assigned for this teacher in this grade', 404));
            }


            let sections = [];
            let genders = [];
            gradeSubjects.forEach(sub => {
                sections.push(sub.section);
                genders.push(sub.gender);
            });

            const uniquSections = new Set(sections);
            const uniquGenders = new Set(genders);

            const publishedExams = await Publish.find({
                exam: exam?._id,
                section: { $in: [...uniquSections] },
                gender: { $in: [...uniquGenders] }
            })
                .populate({
                    path: 'exam',
                    select: '_id examName subjectId',
                    populate: {
                        path: 'subjectId',
                        select: 'subjectName'
                    }
                })
                .populate('section', '_id sectionName')
                .populate({
                    path: 'questionBank',
                    select: '_id questionBankName subject',
                    populate: {
                        path: 'subject',
                        select: 'subjectName'
                    }
                })
                .populate('grade', '_id gradeName');

            res.status(200).json({
                status:'success',
                results: publishedExams.length,
                data: publishedExams,
                publishCount: publishedExams.length,
            });

        }

        
    }
    
});

// Edit published exam dates (fromDate and toDate)
exports.updatePublishedExamDates = catchAsync(async (req, res, next) => {
    const { publishId } = req.params;
    const { startDate, endDate } = req.body;

    const updatedPublish = await Publish.findByIdAndUpdate(
        publishId,
        { startDate, endDate },
        { new: true, runValidators: true }
    );

    if (!updatedPublish) {
        return next(new AppError('No published exam found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            publish: updatedPublish,
        },
    });
});

// Delete a published exam
exports.deletePublishedExam = catchAsync(async (req, res, next) => {
    const { publishId } = req.params;

    const deletedPublish = await Publish.findById(publishId);

    if (!deletedPublish) {
        return next(new AppError('No published exam found with that ID', 404));
    }

    let attempts = await StudentExamAttempt.find({ publishId, attendedStatus: true });

    if (attempts.length > 0) {
        return next(new AppError('Cannot delete a published exam with attended students', 400));
    }

    await StudentExamAttempt.deleteMany({ publishId });
    await Publish.findByIdAndDelete(publishId);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

// Get all sections under the grade where exam is not published
exports.getAllSectionsWithUnpublishedExams = catchAsync(async (req, res, next) => {
    const { examId, gender } = req.query;

    // Fetch the exam to get the grade
    const examData = await OnlineExam.findById(examId);

    if(!examData) {
        return next(new AppError('No exam found with that ID', 404));
    }

    let sections;

    console.log({examData})

    //Get the sections based on User Role
    if(req?.user?.role === "admin"){
        sections = await AcademicStudent.distinct('section',{ academicYear: examData.academicYear, grade:examData.grade, gender:gender, status: 'active' });

        console.log({sections})
    }
    else{
        const teacher = await Teacher.findOne({ userId: req?.user?._id });
        if(!teacher) {
            return next(new AppError("No teacher found for this user", 404));
        }

        //Check SubjectPermission Table for permitted Sections
        const subjectPer = await SubjectPermissions.find({ academicYear: examData.academicYear, grade: examData.grade, teacher: teacher?._id});

        if(subjectPer?.length > 0){
            sections = subjectPer.map(sub => sub.section);
        }
        else{
            //Check Grade Subject Teacher Allocated Subjects
            const gradeSubjects = await GradeSubject.find({ academicYear: examData.academicYear, grade: examData.grade, teacher: teacher?._id, Status: 'active' });

            if(!gradeSubjects.length){
                return next(new AppError('No subject assigned for this teacher in this grade', 404));
            }

            sections = gradeSubjects.map(sub => sub.section);
        }
    }

    // Find all sections under the specified grade
   // const sections = await AcademicStudent.distinct('section',{ academicYear: examData.academicYear, grade:examData.grade, gender:gender, status: 'active' });

    const populatedSections = await Section.find({ _id: { $in: sections } }).select('sectionName');

    if (!sections || sections.length === 0) {
        return next(new AppError('No sections found or no students found', 404));
    }

    // Filter out sections where the exam is published
    const unpublishedSections = [];
    for (const section of populatedSections) {
        const publishedExam = await Publish.findOne({ exam: examId, section:section?._id, gender });
        if (!publishedExam) {
            unpublishedSections.push(section);
        }
    }

    // if (unpublishedSections.length === 0) {
    //     return next(new AppError('No unpublished exams found for the given grade ID', 404));
    // }

    res.status(200).json({
        status: 'success',
        results: unpublishedSections.length,
        data: unpublishedSections,
    });
});

// Get all students under the publishId
exports.getAllStudentsUnderPublishId = catchAsync(async (req, res, next) => {
    const { publishId } = req.query;

    const students = await StudentExamAttempt.find({ publishId }).populate('studentId', 'studentID, studentName');

    if (!students || students.length === 0) {
        return next(new AppError('No students found for the given publish ID', 404));
    }

    res.status(200).json({
        status: 'success',
        results: students.length,
        data: {
            students,
        },
    });
});


//Get Single Published Exam Details
exports.getSinglePublishedExamDetails = catchAsync(async (req, res, next) => {
    const { publishId } = req.params;

        const publishedExam = await Publish.findById(publishId)
            .populate({
                path: 'exam',
                select: '_id examName subjectId',
                populate: {
                    path: 'subjectId',
                    select: 'subjectName'
                }
            })
            .populate({
                path: 'questionBank',
                select: '_id questionBankName subject',
                populate: {
                    path: 'subject',
                    select: 'subjectName'
                }
            })
            .populate('section', '_id sectionName')
            .populate('grade', '_id gradeName');

    if (!publishedExam) {
        return next(new AppError('No published exam found with that ID', 404));
    }

    //Get all questions under questionBank
    const questions = await Question.find({ questionBank: publishedExam.questionBank });

    //publishedExam.questions = questions;

    //get All published students results under publish Id including students details
    const attempts = await StudentExamAttempt.find({ publishId })
        .populate('studentId', '_id, studentID as UserId, studentName')
        .populate({
            path: 'studentAnswers.questionId',
            model: 'Question',
            select: '_id questionText questionType questionImage options correctAnswer marks questionBank createdAt updatedAt'
        });

    //publishedExam.students = attempts;


    // Enhance attempts with better structured question data
    const enhancedAttempts = attempts.map(attempt => {
        const enhancedStudentAnswers = attempt.studentAnswers?.map(answer => ({
            _id: answer._id,
            questionId: answer.questionId, // This will be the populated question object
            studentAnswer: answer.studentAnswer,
        })) || [];

        return {
            _id: attempt._id,
            studentId: attempt.studentId,
            publishId: attempt.publishId,
            totalQuestions: attempt.totalQuestions,
            attendedStatus: attempt.attendedStatus,
            attendedDate: attempt.attendedDate,
            securedMark: attempt.securedMark,
            studentAnswers: enhancedStudentAnswers,
            createdAt: attempt.createdAt,
            updatedAt: attempt.updatedAt
        };
    });

    res.status(200).json({
        status:'success',
        data: {
            publishedExam,
            questions,
            students: enhancedAttempts,
            totalStudents: attempts.length,
            attendedStudents: attempts.filter(a => a.attendedStatus).length,
            unattendedStudents: attempts.filter(a => !a.attendedStatus).length
        },
    });
})

//Update Published Exam Dates
exports.updatePublishedExamDates = catchAsync(async (req, res, next) => {
    const { publishId } = req.params;
    const { startDate, endDate } = req.body;

    const updatedPublish = await Publish.findByIdAndUpdate(
        publishId,
        { startDate, endDate },
        { new: true, runValidators: true }
    );

    if (!updatedPublish) {
        return next(new AppError('No published exam found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            publish: updatedPublish,
        },
    });
});

//Get Attended and UnAttended Students Based on exam Id by finding exam using publish Id
exports.getAttendedAndUnattendedStudents = catchAsync(async (req, res, next) => {
    const { publishId } = req.params;

    const publishedExam = await Publish.findById(publishId)
        .populate({
            path: 'exam',
            select: '_id examName subjectId',
            populate: {
                path: 'subjectId',
                select: 'subjectName'
            }
        })
        .populate({
            path: 'questionBank',
            select: '_id questionBankName subject',
            populate: {
                path: 'subject',
                select: 'subjectName'
            }
        })
        .populate('grade', '_id gradeName')

    if (!publishedExam) {
        return next(new AppError('No published exam found with that ID', 404));
    }

    //get All Student Id based on academicyear, grade, gender and section
    const students = await AcademicStudent.find({ academicYear: publishedExam.exam.academicYear, grade:publishedExam.exam.grade, gender:publishedExam.gender, status: 'active', section:publishedExam.section }).populate('studentId', 'studentID as UserId, _id, studentName').select('studentId')

    let attendedStudents = [];
    let unattendedStudents = [];

    //compare students attended Status from StudentExamAttempt Schema and find attended and not attended students
    for(let student of students){
        //check StudentExamAttempt schema by publishId and studentId for attendedStatus
        const attempt = await StudentExamAttempt.findOne({ 
            studentId: student.studentId._id, 
            publishId: publishId,
            attendedStatus: true 
        });
        
        if(attempt){
            attendedStudents.push({
                ...student.toObject(),
                checked: false
            });
        } else {
            unattendedStudents.push({
                ...student.toObject(),
                checked: false
            });
        }
    }

    res.status(200).json({
        status:'success',
        data: {
            attendedStudents,
            unattendedStudents
        }
    });


    
});

// Get exam report based on examId and StudentPerformance
exports.getExamReport = catchAsync(async (req, res, next) => {
    const { examId } = req.params;

    // Find the exam
    const exam = await OnlineExam.findById(examId)
        .populate({
            path: 'grade',
            select: 'gradeName',
        })
        .populate({
            path: 'subjectId',
            select: 'subjectName',
        })
        .populate({
            path: 'academicYear',
            select: 'academicYear',
        });
    if (!exam) {
        return next(new AppError('No exam found with that ID', 404));
    }

    // Get all StudentPerformance records for this exam
    const performances = await StudentPerformance.find({ examId })
        .populate('studentId', 'studentID studentName')
        .populate({
            path: 'totalMarksArray.publishId',
            model: 'Publish',
            select: 'numberOfQuestions duration startDate endDate section gender'
        });

    // Calculate statistics
    const totalStudents = performances.length;
    const studentsWithAttempts = performances.filter(p => p.attempts > 0);
    const studentsWithoutAttempts = performances.filter(p => p.attempts === 0 || !p.attempts);
    
    // Calculate average marks
    const totalMarks = studentsWithAttempts.reduce((sum, perf) => sum + (perf.bestMarkSecured || 0), 0);
    const averageMarks = studentsWithAttempts.length > 0 ? totalMarks / studentsWithAttempts.length : 0;

    // Get all publishes for this exam
    const publishes = await Publish.find({ exam: examId })
        .populate('section', 'sectionName')
        .select('numberOfQuestions duration startDate endDate section gender attendedUsers totalUsersSelected');

    // Calculate publish statistics
    const totalPublishes = publishes.length;
    const totalAttendedUsers = publishes.reduce((sum, pub) => sum + (pub.attendedUsers || 0), 0);
    const totalUsersSelected = publishes.reduce((sum, pub) => sum + (pub.totalUsersSelected || 0), 0);
    const studentsWithAttemptsCount = totalAttendedUsers;
    const studentsWithoutAttemptsCount = Math.max(totalUsersSelected - studentsWithAttemptsCount, 0);

    res.status(200).json({
        status: 'success',
        data: {
            exam: {
                _id: exam._id,
                examName: exam.examName,
                grade: exam.grade,
                academicYear: exam.academicYear,
                term: exam.term,
                subject: exam.subjectId,
                status: exam.status,
                createdAt: exam.createdAt
            },
            statistics: {
                totalStudents: totalUsersSelected,
                studentsWithAttempts: studentsWithAttemptsCount,
                studentsWithoutAttempts: studentsWithoutAttemptsCount,
                averageMarks: Math.round(averageMarks * 100) / 100,
                totalMarks,
                totalPublishes,
                totalAttendedUsers,
                totalUsersSelected,
                attendanceRate: totalUsersSelected > 0 ? Math.round((totalAttendedUsers / totalUsersSelected) * 100) : 0
            },
            performances: performances.map(perf => ({
                studentId: perf.studentId,
                attempts: perf.attempts || 0,
                bestMarkSecured: perf.bestMarkSecured || 0,
                totalMarksArray: perf.totalMarksArray,
                createdAt: perf.createdAt,
                updatedAt: perf.updatedAt
            })),
            publishes: publishes.map(pub => ({
                _id: pub._id,
                numberOfQuestions: pub.numberOfQuestions,
                duration: pub.duration,
                startDate: pub.startDate,
                endDate: pub.endDate,
                section: pub.section,
                gender: pub.gender,
                attendedUsers: pub.attendedUsers || 0,
                totalUsersSelected: pub.totalUsersSelected || 0
            }))
        }
    });
});
