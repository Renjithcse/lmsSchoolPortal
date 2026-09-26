
const GradeSubject = require("../../models/Admin/GradeSubject");
const Section = require("../../models/Admin/Section");
const SubjectPermissions = require("../../models/Admin/SubjectPermissions");
const Assignment = require("../../models/Assignments/Assignment");
const PublishAssignment = require("../../models/Assignments/Publish");
const StudentAssignmentAttempt = require("../../models/Assignments/StudentAssignment");
const AcademicStudent = require("../../models/users/AcademicStudent");
const Teacher = require("../../models/users/Teacher");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const Subject = require("../../models/Admin/Subject");
const Student = require("../../models/users/Student");
const uploadBase64File = require("../../helper/uploadBase64File");

// Create new Assignment Publish
exports.createAssignmentPublish = async (req, res, next) => {
    try {
        const { assignment, gender, sections, startDate, endDate } = req.body;

        // Fetch the exam to get the grade
        const assignmentData = await Assignment.findById(assignment);
        if (!assignmentData) {
            return next(new AppError('No Assignment found with that ID', 404));
        }

        const grade = assignmentData.grade;

        let results = await Promise.all(sections?.map(async sec => {
            const isPublished = await PublishAssignment.findOne({ assignment, grade, gender, section: sec });
            if (isPublished) {
                throw new AppError('Assignment already published for the given section', 400);
            }

            let students = await AcademicStudent.find({
                academicYear: assignmentData.academicYear,
                grade: grade,
                gender: gender,
                section: sec,
                status: 'active',
            }).select('studentId');

            if (!students || students.length === 0) {
                let sectionDetails = await Section.findById(sec);

                throw new AppError(`No students are found in ${sectionDetails?.sectionName}`, 404);
            }

            let newPublish = await PublishAssignment.create({
                assignment,
                gender,
                section: sec,
                startDate,
                endDate,
                totalUsersSelected: students.length,
                grade,
                createdBy: req.user.id
            });

            const attemptsToCreate = students.map(student => ({
                studentId: student.studentId,
                publishId: newPublish?._id
            }));


            await StudentAssignmentAttempt.insertMany(attemptsToCreate);
        }));

        res.status(201).json({
            status: 'success'
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return next(new AppError(error.message, 400));
        }
        next(error);
    }
};


//Get All published Assignments by Assignment Id
exports.getPublishedAssignments = async (req, res, next) => {
    try {

        //Get the assignment Details By assignment Id
        const assignment = await Assignment.findById(req.params.assignmentId);
        if (!assignment) {
            return res.status(404).json({
                status: "error",
                message: "Assignment not found",
            });
        }

        //Limit the user to get published assignments

        //Admin user can get published assignments
        if (req.user.role === 'admin') {
            const publishedAssignments = await PublishAssignment.find({ assignment: req.params.assignmentId }).populate('section', '_id, sectionName')
            res.status(200).json({
                status: 'success',
                data: publishedAssignments
            });
        }
        else {
            //Check the user Subject Permissions for eligible Sections and gender
            const teacher = await Teacher.findOne({ userId: req?.user?._id });
            if (!teacher) {
                return next(new AppError("No teacher found for this user", 404));
            }
            let subjectPer = await SubjectPermissions.find({ academicYear: assignment?.academicYear, grade: assignment?.grade, teacher: teacher?._id });

            if (subjectPer?.length > 0) {
                let sections = [];
                let genders = [];

                subjectPer.forEach(sub => {
                    sections.push(sub.section);
                    genders.push(sub.gender);
                });

                const uniquSections = new Set(sections);
                const uniquGenders = new Set(genders);

                const publishedAssignments = await PublishAssignment.find({ assignment: req.params.assignmentId, grade: assignment?.grade, gender: { $in: uniquGenders }, section: { $in: uniquSections } }).populate('section', '_id, sectionName')

                res.status(200).json({
                    status: 'success',
                    data: publishedAssignments
                });

            }
            else {
                //Check Grade Subject Teacher Allocated Subjects
                const gradeSubjects = await GradeSubject.find({ academicYear: assignment?.academicYear, grade: assignment?.grade, teacher: teacher?._id, Status: 'active' });

                if (!gradeSubjects.length) {
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

                const publishedAssignments = await PublishAssignment.find({ assignment: req.params.assignmentId, grade: assignment?.grade, gender: { $in: uniquGenders }, section: { $in: uniquSections } }).populate('section', '_id, sectionName')

                res.status(200).json({
                    status: 'success',
                    data: publishedAssignments
                });

            }
        }
    } catch (error) {
        next(error);
    }
};

//Update Published Exam Dates by AssignmentId
exports.updatePublishedAssignmentDates = async (req, res, next) => {
    try {
        const { publishId } = req.params;
        const { startDate, endDate } = req.body;

        const updatedPublish = await PublishAssignment.findByIdAndUpdate(
            publishId,
            { startDate, endDate },
            { new: true }
        ).populate('section', '_id, sectionName');

        if (!updatedPublish) {
            return next(new AppError('No published assignment found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: updatedPublish
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return next(new AppError(error.message, 400));
        }
        next(error);
    }
};

//Delete Published Assignment by PublishId
exports.deletePublishedAssignment = async (req, res, next) => {
    try {
        const publishId = req.params.publishId;

        // First, check if the published assignment exists
        const publishedAssignment = await PublishAssignment.findById(publishId);
        if (!publishedAssignment) {
            return next(new AppError('No published assignment found with that ID', 404));
        }

        // Check if any students have attended this assignment
        const attempts = await StudentAssignmentAttempt.find({ publishId: publishId, attendedStatus: true });
        if (attempts.length > 0) {
            return next(new AppError(
                `Cannot delete published assignment. ${attempts.length} student(s) have already attempted this assignment.`, 
                400
            ));
        }


        // Delete only the published assignment record (not the original assignment)
        await PublishAssignment.findByIdAndDelete(publishId);

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

//Get All Sections which are not published
exports.getNonPublishedSections = async (req, res, next) => {
    try {
        const { assignment, gender } = req.query;

        // Fetch the exam to get the grade
        const assignmentData = await Assignment.findById(assignment);

        if (!assignmentData) {
            return next(new AppError('No Assignment found with that ID', 404));
        }

        // Find all sections under the specified grade

        let sections;

        //Get the sections based on User Role
        if (req?.user?.role === "admin") {
            sections = await AcademicStudent.distinct('section', { academicYear: assignmentData.academicYear, grade: assignmentData.grade, gender: gender, status: 'active' });
        }
        else {
            const teacher = await Teacher.findOne({ userId: req?.user?._id });
            if (!teacher) {
                return next(new AppError("No teacher found for this user", 404));
            }

            //Check SubjectPermission Table for permitted Sections
            const subjectPer = await SubjectPermissions.find({ academicYear: assignmentData.academicYear, grade: assignmentData.grade, teacher: teacher?._id });

            if (subjectPer?.length > 0) {
                sections = subjectPer.map(sub => sub.section);
            }
            else {
                //Check Grade Subject Teacher Allocated Subjects
                const gradeSubjects = await GradeSubject.find({ academicYear: assignmentData.academicYear, grade: assignmentData.grade, teacher: teacher?._id, Status: 'active' });

                if (!gradeSubjects.length) {
                    return next(new AppError('No subject assigned for this teacher in this grade', 404));
                }

                sections = gradeSubjects.map(sub => sub.section);
            }
        }

        if (!sections || sections.length === 0) {
            return next(new AppError('No sections found for the given grade ID', 404));
        }

        const populatedSections = await Section.find({ _id: { $in: sections } }).select('sectionName');



        // Filter out sections where the exam is published
        const unpublishedSections = [];
        for (const section of populatedSections) {
            const publishedAssignment = await PublishAssignment.findOne({ exam: assignment, section: section?._id, gender });
            if (!publishedAssignment) {
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

    }
    catch (error) {
        next(error);
    }
};



//Get single Published Assignment Details
exports.getAllStudentsUnderPublishId = catchAsync(async (req, res, next) => {
    const { publishId } = req.params;

    const publishedAssignment = await PublishAssignment.findById(publishId).populate('assignment', '_id, assignmentName').populate('section', '_id, sectionName');

    if (!publishedAssignment) {
        return next(new AppError('No published Assignment found with that ID', 404));
    }



    //get All published students results under publish Id including students details
    const attempts = await StudentAssignmentAttempt.find({ publishId }).populate('studentId', '_id, studentID as UserId, studentName');

    //publishedExam.students = attempts;


    res.status(200).json({
        status: 'success',
        data: {
            publishedAssignment,
            students: attempts,
        },
    });
});

//Get All Assignments Summary Group By SubjectId
exports.getAssignmentsSummaryByStudentId = catchAsync(async (req, res, next) => {

    const currentDate = new Date();

    const student = await Student.findOne({ userId: req?.user?._id })

    if (!student) {
        return next(new AppError('No student found for this user', 404));
    }

    //return res.status(200).json({ subjects: student, studentId });

    // Fetch all assignment attempts for the student
    const attempts = await StudentAssignmentAttempt.find({ studentId: student?._id })
        .populate({
            path: 'publishId',
            populate: { path: 'assignment', select: 'subjectId' } // Assuming `assignment` has `subject`
        });

    // return res.status(200).json({ subjects: attempts });

    // Organize assignments by subject
    let subjectAssignmentMap = {};

    for (const attempt of attempts) {
        // Check if publishId exists and is populated
        if (!attempt.publishId) continue;
        
        const publish = await PublishAssignment.findById(attempt.publishId);
        if (!publish) continue;
        
        // Check if assignment is populated and has subjectId
        if (!attempt.publishId.assignment || !attempt.publishId.assignment.subjectId) continue;

        const subjectId = attempt.publishId.assignment.subjectId.toString();

        if (!subjectAssignmentMap[subjectId]) {
            subjectAssignmentMap[subjectId] = {
                subjectId,
                newAssignments: 0,
                pendingAssignments: 0,
                completedAssignments: 0,
                expiredAssignments: 0,
            };
        }

        const isAttended = attempt.attendedStatus;
        const isExpired = publish.endDate < currentDate;

        if (isAttended) {
            subjectAssignmentMap[subjectId].completedAssignments++;
        } else if (!isAttended && !isExpired) {
            subjectAssignmentMap[subjectId].newAssignments++;
        } else if (!isAttended && isExpired) {
            subjectAssignmentMap[subjectId].expiredAssignments++;
        }
    }

    // Fetch subject details
    const subjectIds = Object.keys(subjectAssignmentMap);
    const subjects = await Subject.find({ _id: { $in: subjectIds } });

    // Merge subject details with counts
    const responseData = subjects.map(subject => ({
        subjectId: subject._id,
        subjectName: subject.subjectName,
        status: subject.status,
        ...subjectAssignmentMap[subject._id.toString()],
    }));

    // Return response
    return res.status(200).json({ subjects: responseData });
});

//Get All Students Assignments By Subject ID
exports.getStudentsSubjectWiseAssignments = catchAsync(async (req, res, next) => {

    const { id: subjectId } = req?.params;


    const student = await Student.findOne({ userId: req?.user?._id })

    if (!student) {
        return next(new AppError('No student found for this user', 404));
    }

    const assignments = await StudentAssignmentAttempt.find({ studentId: student?._id })
        .populate({
            path: 'publishId',
            populate: {
                path: 'assignment',
                match: { subjectId } // Filter assignments by subjectId
            }
        })
        .lean(); // Convert to plain JavaScript objects

    // Filter out attempts where publishId or assignment is null (due to match failing)
    const filteredAssignments = assignments.filter(attempt => attempt.publishId && attempt.publishId.assignment);

    res.status(200).json({ success: true, data: filteredAssignments });


})


//Save Student assignement answer
exports.saveStudentAssignment = catchAsync(async (req, res, next) => {
    const { studentAnswer, studentAttachment, attemptId } = req.body;

    const student = await Student.findOne({ userId: req?.user?._id })

    if (!student) {
        return next(new AppError('No student found for this user', 404));
    }

    if (!studentAnswer && !studentAttachment) {
        return next(new AppError('At least one of studentAnswer or studentAttachment is required', 400));
    }

    let attempt = await StudentAssignmentAttempt.findOne({ _id: attemptId, studentId: student?._id });

    if (!attempt) {
        return next(new AppError('Assignment attempt not found', 404));
    }

    let filePath = null;

    // Handle base64 file upload
    if (studentAttachment) {
        let fullPath = null;
        
        // Check if studentAttachment is an object with data, filename, type
        if (studentAttachment.data && studentAttachment.type) {
            // Convert to proper base64 format with metadata
            const base64String = `data:${studentAttachment.type};base64,${studentAttachment.data}`;
            fullPath = uploadBase64File(base64String, 'assignment', `assignment_${attemptId}_`);
        } else if (typeof studentAttachment === 'string') {
            // If it's already a base64 string
            fullPath = uploadBase64File(studentAttachment, 'assignment', `assignment_${attemptId}_`);
        }
        
        // Check if file upload was successful
        if (fullPath) {
            // Extract only the relative path from uploads/
            filePath = fullPath.replace(/^.*?uploads\//, 'uploads/');
        } else {
            return next(new AppError('Failed to upload file. Please try again.', 400));
        }
    }

    console.log({filePath})

    // Update the assignment attempt
    attempt.attendedStatus = true;
    attempt.attendedDate = new Date();
    if (studentAnswer) attempt.studentAnswer = studentAnswer;
    if (filePath) attempt.studentAttachment = filePath;

    await attempt.save();

    // Update the attendedUsers count in PublishAssignment
    const publishAssignment = await PublishAssignment.findById(attempt.publishId);
    if (publishAssignment) {
        publishAssignment.attendedUsers = (publishAssignment.attendedUsers || 0) + 1;
        await publishAssignment.save();
    }

    res.status(200).json({
        success: true,
        message: 'Assignment updated successfully',
        data: attempt
    });

})

/**
 * Get a single assignment details for a student.
 * @route GET /api/student-assignment/:assignmentId
 */
exports.getSingleAssignment = catchAsync(async (req, res, next) => {

    const student = await Student.findOne({ userId: req?.user?._id })

    if (!student) {
        return next(new AppError('No student found for this user', 404));
    }
    const { assignmentId } = req.params;

    // Find the assignment
    const assignment = await Assignment.findById(assignmentId)
        .populate('academicYear', 'year')
        .populate('grade', '_id, gradeName')
        .populate('subjectId', 'subjectName')
        .populate('createdBy', 'name');

    if (!assignment) {
        return next(new AppError('Assignment not found', 404));
    }

    // Check if the assignment was published
    const publishedAssignment = await PublishAssignment.findOne({ assignment: assignmentId });

    if (!publishedAssignment) {
        return next(new AppError('Assignment is not published', 404));
    }

    // Get student's attempt details if available
    const studentAttempt = await StudentAssignmentAttempt.findOne({
        studentId: student._id,
        publishId: publishedAssignment._id
    });

    console.log({assignment})

    // Format response
    const response = {
        assignmentDetails: {
            _id: assignment._id,
            name: assignment.assignmentName,
            academicYear: assignment.academicYear?.year || null,
            grade: assignment.grade?.gradeName || null,
            term: assignment.term,
            subject: assignment.subjectId?.subjectName || null,
            question: assignment.question,
            questionFile: assignment.questionFile,
            status: assignment.status,
            createdBy: assignment.createdBy?.name || null,
            publishedStartDate: publishedAssignment.startDate,
            publishedEndDate: publishedAssignment.endDate
        },
        studentAttempt: studentAttempt
            ? {
                _id: studentAttempt._id,
                attendedStatus: studentAttempt.attendedStatus,
                attendedDate: studentAttempt.attendedDate,
                studentAnswer: studentAttempt.studentAnswer,
                studentAttachment: studentAttempt.studentAttachment,
                teacherRemarks: studentAttempt.teacherRemarks,
            }
            : null
    };

    res.status(200).json({
        success: true,
        data: response
    });
});

/**
 * Update teacher remarks for a student's assignment attempt.
 * @route PUT /api/teacher-remarks/:attemptId
 */
exports.updateTeacherRemarks = catchAsync(async (req, res, next) => {
    const { attemptId } = req.params;
    const { teacherRemarks } = req.body;
    const teacher = await Teacher.findOne({ userId: req?.user?._id })

    if (!teacher) {
        return next(new AppError('No teacher found for this user', 404));
    }


    if (!teacherRemarks) {
        return next(new AppError('Teacher remarks are required', 400));
    }

    // Find the student's assignment attempt
    let attempt = await StudentAssignmentAttempt.findById(attemptId);

    if (!attempt) {
        return next(new AppError('Assignment attempt not found', 404));
    }

    // Update teacher remarks and save
    attempt.teacherId = teacher?._id;
    attempt.teacherRemarks = teacherRemarks;

    await attempt.save();

    res.status(200).json({
        success: true,
        message: 'Teacher remarks updated successfully',
        data: attempt
    });

});


