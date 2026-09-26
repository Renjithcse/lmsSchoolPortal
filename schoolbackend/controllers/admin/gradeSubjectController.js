const GradeSubject = require('../../models/Admin/GradeSubject');
const Subject = require('../../models/Admin/Subject');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const { default: mongoose } = require('mongoose');
const Settings = require('../../models/Admin/Settings');
const OnlineExam = require('../../models/OnlineExam/OnlineExam');
const Assignment = require('../../models/Assignments/Assignment');
const Publish = require('../../models/OnlineExam/Publish');
const PublishAssignment = require('../../models/Assignments/Publish');
const SubjectPermissions = require('../../models/Admin/SubjectPermissions');
const Student = require('../../models/users/Student');
const AcademicStudent = require('../../models/users/AcademicStudent');
const Section = require('../../models/Admin/Section');
const GradePermissions = require('../../models/Admin/GradePermissions');
const { on } = require('../../models/userModel');
const Teacher = require('../../models/users/Teacher');
const ClassTeacher = require('../../models/Admin/ClassTeacher');

// Create multiple GradeSubject records
exports.createGradeSubjects = catchAsync(async (req, res, next) => {

    if(!req?.body?.academicYear){
        //Get Current Academic Year from Settings
        const currentAcademicYear = await Settings.findOne();

        if(!currentAcademicYear){
            return next(new AppError("No current academic year found in settings", 404));
        }

        req.body.academicYear = currentAcademicYear?.academicYear
    }

    const { subjects, type, grade, gender, section, academicYear, Status } = req.body;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
        return next(new AppError('Please provide an array of subjects', 400));
    }

    // De-duplicate incoming subjects array
    const subjectIds = Array.from(new Set(subjects.map((s) => String(s))));

    // Check for existing records that would conflict with uniqueness
    const existing = await GradeSubject.find({
        academicYear,
        grade,
        gender,
        section,
        subject: { $in: subjectIds }
    }).populate('subject', 'subjectName');

    if (existing.length) {
        const duplicateNames = existing.map(e => e?.subject?.subjectName || String(e.subject));
        return res.status(409).json({
            status: 'fail',
            message: `Subject(s) already assigned for this academic year/grade/section/gender: ${duplicateNames.join(', ')}`,
            duplicates: existing.map(e => ({ id: e._id, subject: e.subject }))
        });
    }

    // Create payload and insert
    const gradeSubjects = subjectIds.map(subject => ({
        academicYear,
        grade,
        gender,
        section,
        subject,
        type,
        Status
    }));

    const createdGradeSubjects = await GradeSubject.insertMany(gradeSubjects, { ordered: true });

    res.status(201).json({
        status: 'success',
        data: {
            createdGradeSubjects,
        },
    });
});

// Get all GradeSubject records
exports.getGradeSubjects = catchAsync(async (req, res, next) => {
    let filters = {};
    if (req?.query?.type) {
        const { type, ...rest } = req.query
        filters = { ...rest, type: { $in: JSON.parse(req?.query?.type) } };
    }
    else{
        filters = req?.query
    }
    if(!req?.query?.academicYear){
        const currentAcademicYear = await Settings.findOne();

        if(!currentAcademicYear){
            return next(new AppError("No current academic year found in settings", 404));
        }

        filters.academicYear = currentAcademicYear?.academicYear;
    }

    const gradeSubjects = await GradeSubject.find(filters)
        .populate('subject', 'subjectName')
        .populate('teacher', 'employeeName employeeId');



    res.status(200).json({
        status: 'success',
        results: gradeSubjects.length,
        data: gradeSubjects,
    });
});



// Get subjects not assigned to a grade subject with specified filters
exports.getUnassignedSubjects = catchAsync(async (req, res, next) => {
    const { grade, gender, section } = req.query;

    let academicYear;

    if(!req?.query?.academicYear){
        //Get Current Academic Year from Settings
        const currentAcademicYear = await Settings.findOne();

        if(!currentAcademicYear){
            return next(new AppError("No current academic year found in settings", 404));
        }

        academicYear = currentAcademicYear?.academicYear
    }
    else{
        academicYear = req?.query?.academicYear;
    }

    // Find all grade subjects that match the provided filters
    const assignedSubjects = await GradeSubject.find({
        academicYear, 
        grade, 
        gender, 
        section
    });

    // Extract subject IDs
    const assignedSubjectIds = assignedSubjects.map(gs => gs.subject);

    // Find subjects that are not in the assigned subjects list
    const unassignedSubjects = await Subject.find({
        _id: { $nin: assignedSubjectIds }
    });

    res.status(200).json({
        status: 'success',
        results: unassignedSubjects.length,
        data: unassignedSubjects
    });
});

// GradeSubjects based on academicYear, grade, gender, and section
exports.getFilteredGradeSubjects = catchAsync(async (req, res, next) => {
    const { academicYear, grade, gender, section } = req.query;

    // Build query object
    const queryObj = {};
    if (academicYear) queryObj.academicYear = academicYear;
    if (grade) queryObj.grade = grade;
    if (gender) queryObj.gender = gender;
    if (section) queryObj.section = section;

    // Find GradeSubjects based on filters
    const gradeSubjects = await GradeSubject.find(queryObj)
        .populate('academicYear', 'year')
        .populate('Grade', 'gradeName')
        .populate('subject', 'subjectName')
        .populate('section', 'sectionName')
        .populate('teacher', 'employeeName');

    res.status(200).json({
        status: 'success',
        results: gradeSubjects.length,
        data: gradeSubjects
    });
});

// Get a single GradeSubject record by ID
exports.getGradeSubjectById = catchAsync(async (req, res, next) => {
    const gradeSubject = await GradeSubject.findById(req.params.id)
        .populate('academicYear', 'year')
        .populate('Grade', 'gradeName')
        .populate('subject', 'subjectName')
        .populate('section', 'sectionName')
        .populate('teacher', 'employeeName');

    if (!gradeSubject) {
        return next(new AppError('No gradeSubject record found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            gradeSubject,
        },
    });
});



// Update a GradeSubject record by ID
exports.updateGradeSubject = catchAsync(async (req, res, next) => {
    // Get the current record to compare with
    const currentRecord = await GradeSubject.findById(req.params.id);
    if (!currentRecord) {
        return next(new AppError('No gradeSubject record found with that ID', 404));
    }

    // Prepare the updated values (use existing values if not provided in request)
    const updatedValues = {
        academicYear: req.body.academicYear || currentRecord.academicYear,
        grade: req.body.grade || currentRecord.grade,
        gender: req.body.gender || currentRecord.gender,
        section: req.body.section || currentRecord.section,
        subject: req.body.subject || currentRecord.subject,
        teacher: req.body.teacher || currentRecord.teacher,
        Status: req.body.Status !== undefined ? req.body.Status : currentRecord.Status
    };

    // Check if this combination would create a duplicate (excluding the current record)
    const duplicateRecord = await GradeSubject.findOne({
        _id: { $ne: req.params.id },
        academicYear: updatedValues.academicYear,
        grade: updatedValues.grade,
        gender: updatedValues.gender,
        section: updatedValues.section,
        subject: updatedValues.subject,
    })
    .populate('academicYear', 'academicYear')
    .populate('grade', 'gradeName')
    .populate('subject', 'subjectName')
    .populate('section', 'sectionName')
    .populate('teacher', 'employeeName');

    if (duplicateRecord) {
        const conflictDetails = `${duplicateRecord.grade?.gradeName || 'Unknown Grade'} - ${duplicateRecord.section?.sectionName || 'Unknown Section'} (${duplicateRecord.gender}) - ${duplicateRecord.subject?.subjectName || 'Unknown Subject'}`;
        return res.status(409).json({
            status: 'fail',
            message: `This subject assignment already exists: ${conflictDetails}`,
            error: { type: 'duplicate_record', id: duplicateRecord._id }
        });
    }

    // Perform the update
    const gradeSubject = await GradeSubject.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    })
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('subject', 'subjectName')
        .populate('section', 'sectionName')
        .populate('teacher', 'employeeName');

    res.status(200).json({
        status: 'success',
        data: {
            gradeSubject,
        },
    });
});

// Find duplicate GradeSubject records
exports.findDuplicateGradeSubjects = catchAsync(async (req, res, next) => {
    const { academicYear, grade, gender, section, subject, teacher, Status } = req.query;
    
    if (!academicYear || !grade || !gender || !section || !subject) {
        return next(new AppError('Please provide academicYear, grade, gender, section, and subject to check for duplicates', 400));
    }

    const query = {
        academicYear,
        grade,
        gender,
        section,
        subject,
        Status: Status || 'active'
    };

    // Add teacher to query if provided
    if (teacher) {
        query.teacher = teacher;
    }

    const duplicates = await GradeSubject.find(query)
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('subject', 'subjectName')
        .populate('section', 'sectionName')
        .populate('teacher', 'employeeName')
        .sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        data: {
            found: duplicates.length,
            records: duplicates,
            message: duplicates.length > 0 ? 
                `Found ${duplicates.length} existing record(s) with this combination` : 
                'No existing records found with this combination'
        }
    });
});

// Delete a GradeSubject record by ID
exports.deleteGradeSubject = catchAsync(async (req, res, next) => {
    const gradeSubjectId = req.params.id;

    // First, check if the grade subject exists
    const gradeSubject = await GradeSubject.findById(gradeSubjectId);
    if (!gradeSubject) {
        return next(new AppError('No gradeSubject record found with that ID', 404));
    }

    console.log({gradeSubject})

    // Check if the grade subject is being used in OnlineExam
    const onlineExams = await OnlineExam.find({ 
        academicYear: gradeSubject.academicYear,
        grade: gradeSubject.grade,
        subjectId: gradeSubject.subject
    });

    // console.log({onlineExams})
    if (onlineExams.length > 0) {
        return res.status(400).json({ 
            message: `Cannot delete grade subject. This grade subject is being used by ${onlineExams.length} online exam(s). Please delete the exams first.` 
        });
    }

    // Check if the grade subject is being used in Assignment
    const assignments = await Assignment.find({ 
        academicYear: gradeSubject.academicYear,
        grade: gradeSubject.grade,
        subjectId: gradeSubject.subject
    });
    if (assignments.length > 0) {
        return res.status(400).json({ 
            message: `Cannot delete grade subject. This grade subject is being used by ${assignments.length} assignment(s). Please delete the assignments first.` 
        });
    }

    // Check if the grade subject is being used in Publish (Online Exam)
    const onlineExamPublishes = await Publish.find({ 
        exam: { $in: onlineExams.map(exam => exam._id) }
    });
    if (onlineExamPublishes.length > 0) {
        return res.status(400).json({ 
            message: `Cannot delete grade subject. This grade subject is being used by ${onlineExamPublishes.length} published online exam(s). Please delete the published exams first.` 
        });
    }

    // Check if the grade subject is being used in PublishAssignment
    const assignmentPublishes = await PublishAssignment.find({ 
        assignment: { $in: assignments.map(assignment => assignment._id) }
    });
    if (assignmentPublishes.length > 0) {
        return res.status(400).json({ 
            message: `Cannot delete grade subject. This grade subject is being used by ${assignmentPublishes.length} published assignment(s). Please delete the published assignments first.` 
        });
    }

    // Check if the grade subject is being used in SubjectPermissions
    const subjectPermissions = await SubjectPermissions.find({ 
        academicYear: gradeSubject.academicYear,
        grade: gradeSubject.grade,
        subject: gradeSubject.subject
    });
    if (subjectPermissions.length > 0) {
        return res.status(400).json({ 
            message: `Cannot delete grade subject. This grade subject is being used by ${subjectPermissions.length} subject permission(s). Please delete the subject permissions first.` 
        });
    }


    // If no dependencies exist, proceed with deletion
    await GradeSubject.findByIdAndDelete(gradeSubjectId);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});


// Get unique subjects for a specific academic year and grade
exports.getUniqueSubjects = async (req, res, next) => {
    try {
        const { academicYear, grade } = req.params;

        const uniqueSubjects = await GradeSubject.aggregate([
            {
                $match: {
                    academicYear: new mongoose.Types.ObjectId(academicYear),
                    grade:new mongoose.Types.ObjectId(grade),
                    Status: 'active' // Optional: filter by active status
                }
            },
            {
                $group: {
                    _id: "$subject", // Group by subject to get unique values
                }
            },
            {
                $lookup: {
                    from: 'subjects', // Collection name of the Subject model
                    localField: '_id',
                    foreignField: '_id',
                    as: 'subjectDetails'
                }
            },
            {
                $unwind: "$subjectDetails" // Unwind to get the details of each subject
            },
            {
                $project: {
                    _id: 0,
                    subjectId: "$_id",
                    subjectName: "$subjectDetails.subjectName", // Adjust based on your Subject schema
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: uniqueSubjects
        });
    } catch (err) {
        next(err); // Handle errors as needed
    }
};

// Get available genders where sections have no subjects registered
exports.getAvailableGendersForCopy = catchAsync(async (req, res, next) => {
    const { grade, section } = req.query;

    let academicYear;;

    if(!req?.query?.academicYear){
        //Get Current Academic Year from Settings
        const currentAcademicYear = await Settings.findOne();

        if(!currentAcademicYear){
            return next(new AppError("No current academic year found in settings", 404));
        }

        req.query.academicYear = currentAcademicYear?.academicYear
    }
    else{
        academicYear = req?.query?.academicYear;
    }

    console.log({query: req?.query})

    if (!grade) {
        return next(new AppError('Please provide  grade', 400));
    }

    let genders = []
    //Check if user is admin
    if(req?.user?.role === "admin"){
        genders = ["male", "female"]
        
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
            genders = gradePermissions?.gender;
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

            genders = gradeGender;
        }
    }
   

   
    // Filter genders: exclude if at least one section under that gender has subjects registered
    const availableGenders = [];
    
    for (const gender of genders) {

        // Check if any section under this gender has subjects registered
        const hasSubjects = await GradeSubject.exists({
            academicYear: academicYear,
            grade: grade,
            gender: gender
        });

        // Only include gender if NO sections have subjects registered
        if (!hasSubjects) {
            availableGenders.push(gender);
        }
    }

    res.status(200).json({
        status: 'success',
        data: availableGenders
    });
});

// Get sections for a gender where no subjects are registered
exports.getAvailableSectionsForCopy = catchAsync(async (req, res, next) => {
    const { grade, gender } = req.query;

    let academicYear;

    if(!req?.query?.academicYear){
        //Get Current Academic Year from Settings
        const currentAcademicYear = await Settings.findOne();

        if(!currentAcademicYear){
            return next(new AppError("No current academic year found in settings", 404));
        }

        academicYear = currentAcademicYear?.academicYear
    }
    else{
        academicYear = req?.query?.academicYear;
    }

    if (!grade || !gender) {
        return next(new AppError('Please provide grade and gender', 400));
    }

    let allSections = [];

    const sections = await Section.find({ status: 'active' });

    if(sections.length > 0){
        allSections = sections.map(section => section._id);
    }
    
    //Check if user is admin
    // if(req?.user?.role === "admin"){
    //     // Get all sections for this gender, grade, and academic year
    //     allSections = await AcademicStudent.distinct('section', {
    //         academicYear: academicYear,
    //         grade: grade,
    //         gender: gender,
    //         status: 'active'
    //     });
    // }
    // else {
    //     //Check Grade Permissions If any Permissions Registered
    //     //Find Teacher Id for the user
    //     const teacher = await Teacher.findOne({ userId: req?.user?._id });
    //     if(!teacher) {
    //         return next(new AppError("No teacher found for this user", 404));
    //     }
        
    //     // Check SubjectPermissions first
    //     let subjectPer = await SubjectPermissions.find({ 
    //         academicYear: academicYear, 
    //         grade: grade, 
    //         gender: gender, 
    //         teacher: teacher?._id
    //     }).select('section').lean();

    //     if(subjectPer?.length > 0){
    //         // Extract section IDs from SubjectPermissions
    //         allSections = subjectPer.map(sp => {
    //             const section = sp.section;
    //             return section && typeof section === 'object' ? section._id : section;
    //         }).filter(id => id);
    //     }
    //     else{
    //         const filters = { 
    //             academicYear: academicYear, 
    //             teacher: teacher?._id, 
    //             grade: grade, 
    //             gender: gender,
    //             Status: 'active' 
    //         }
    //         //No Permisions Registered. Check Grade Subject whether teacher allocated
    //         allSections = await GradeSubject.distinct('section', filters);
    //     }
    // }

    if (!allSections || allSections.length === 0) {
        return res.status(200).json({
            status: 'success',
            results: 0,
            data: []
        });
    }

    // Get sections that already have subjects registered
    const sectionsWithSubjects = await GradeSubject.distinct('section', {
        academicYear: academicYear,
        grade: grade,
        gender: gender,
        section: { $in: allSections }
    });

    // Filter out sections that have subjects registered
    const availableSectionIds = allSections.filter(
        sectionId => !sectionsWithSubjects.some(
            sectionWithSubject => sectionWithSubject.toString() === sectionId.toString()
        )
    );

    // Populate section details
    const availableSections = await Section.find({
        _id: { $in: availableSectionIds },
        status: 'active'
    }).select('sectionName');

    res.status(200).json({
        status: 'success',
        results: availableSections.length,
        data: availableSections
    });
});

// Copy grade subjects to multiple sections
exports.copyGradeSubjects = catchAsync(async (req, res, next) => {
    const { sourceFilters, targetGender, targetSections } = req.body;

    if (!sourceFilters || !targetGender || !targetSections || !Array.isArray(targetSections) || targetSections.length === 0) {
        return next(new AppError('Please provide sourceFilters, targetGender, and targetSections array', 400));
    }

    const { academicYear: sourceAcademicYear, grade: sourceGrade, gender: sourceGender, section: sourceSection } = sourceFilters;

    if (!sourceGrade || !sourceGender || !sourceSection) {
        return next(new AppError('Source filters must include grade, gender, and section', 400));
    }

    // Get current academic year if not provided
    let currentAcademicYear;
    if (!sourceAcademicYear) {
        //Get Current Academic Year from Settings
        const currentAcademicYearSettings = await Settings.findOne();
        if (!currentAcademicYearSettings) {
            return next(new AppError("No current academic year found in settings", 404));
        }
        currentAcademicYear = currentAcademicYearSettings.academicYear;
    } else {
        currentAcademicYear = sourceAcademicYear;
    }

    // Get source grade subjects
    const sourceGradeSubjects = await GradeSubject.find({
        academicYear: currentAcademicYear,
        grade: sourceGrade,
        gender: sourceGender,
        section: sourceSection
    }).populate('subject', 'subjectName');

    if (!sourceGradeSubjects || sourceGradeSubjects.length === 0) {
        return next(new AppError('No grade subjects found for the source filters', 404));
    }

    // Prepare data for bulk insert
    const gradeSubjectsToCreate = [];
    const errors = [];

    for (const targetSection of targetSections) {
        for (const sourceGradeSubject of sourceGradeSubjects) {
            // Get subject ID (handle both populated and non-populated cases)
            const subjectId = sourceGradeSubject.subject?._id || sourceGradeSubject.subject;
            
            // Check if this combination already exists
            const existing = await GradeSubject.findOne({
                academicYear: currentAcademicYear,
                grade: sourceGrade,
                gender: targetGender,
                section: targetSection,
                subject: subjectId
            });

            if (!existing) {
                gradeSubjectsToCreate.push({
                    academicYear: currentAcademicYear,
                    grade: sourceGrade,
                    gender: targetGender,
                    section: targetSection,
                    subject: subjectId,
                    type: sourceGradeSubject.type,
                    Status: sourceGradeSubject.Status || 'active'
                });
            } else {
                errors.push({
                    section: targetSection,
                    subject: subjectId,
                    message: `Subject already exists for this combination`
                });
            }
        }
    }

    // Bulk insert
    let createdGradeSubjects = [];
    if (gradeSubjectsToCreate.length > 0) {
        createdGradeSubjects = await GradeSubject.insertMany(gradeSubjectsToCreate, { ordered: false });
    }

    res.status(201).json({
        status: 'success',
        data: {
            created: createdGradeSubjects.length,
            createdGradeSubjects,
            errors: errors.length > 0 ? errors : undefined
        }
    });
});

// Bulk assign teacher to multiple grade subjects
exports.bulkAssignTeacher = catchAsync(async (req, res, next) => {
    const { gradeSubjectIds, teacher } = req.body;    // Validate required fields
    if (!gradeSubjectIds || !Array.isArray(gradeSubjectIds) || gradeSubjectIds.length === 0) {
        return next(new AppError('Please provide an array of grade subject IDs', 400));
    }    if (!teacher) {
        return next(new AppError('Please provide a teacher ID', 400));
    }    // Convert IDs to ObjectIds
    const gradeSubjectObjectIds = gradeSubjectIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));

    if (gradeSubjectObjectIds.length === 0) {
        return next(new AppError('Please provide valid grade subject IDs', 400));
    }

    const teacherId = mongoose.Types.ObjectId.isValid(teacher) 
        ? new mongoose.Types.ObjectId(teacher) 
        : teacher;

    // Update all grade subjects with the teacher
    const updateResult = await GradeSubject.updateMany(
        {
            _id: { $in: gradeSubjectObjectIds },
            Status: 'active'
        },
        {
            $set: { teacher: teacherId }
        }
    );    // Get updated grade subjects
    const updatedGradeSubjects = await GradeSubject.find({
        _id: { $in: gradeSubjectObjectIds },
        Status: 'active'
    })
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('subject', 'subjectName')
        .populate('section', 'sectionName')
        .populate('teacher', 'employeeName');    res.status(200).json({
        status: 'success',
        data: {
            updated: updateResult.modifiedCount,
            total: updatedGradeSubjects.length,
            gradeSubjects: updatedGradeSubjects
        }
    });
});

// Get class teacher for a grade + gender + section (+ academicYear)
exports.getClassTeacher = catchAsync(async (req, res, next) => {
    const { grade, gender, section } = req.query;

    if (!grade || !gender || !section) {
        return next(new AppError('Please provide grade, gender and section', 400));
    }

    let academicYear = req?.query?.academicYear;
    if (!academicYear) {
        const currentAcademicYear = await Settings.findOne();
        if (!currentAcademicYear) {
            return next(new AppError("No current academic year found in settings", 404));
        }
        academicYear = currentAcademicYear?.academicYear;
    }

    const assignment = await ClassTeacher.findOne({
        academicYear,
        grade,
        gender,
        section
    }).populate('teacher', 'employeeName employeeId');

    res.status(200).json({
        status: 'success',
        data: {
            classTeacher: assignment || null
        }
    });
});

// Create/update class teacher for a grade + gender + section (+ academicYear)
exports.setClassTeacher = catchAsync(async (req, res, next) => {
    const { grade, gender, section, teacher } = req.body;

    if (!grade || !gender || !section || !teacher) {
        return next(new AppError('Please provide grade, gender, section and teacher', 400));
    }

    let academicYear = req?.body?.academicYear;
    if (!academicYear) {
        const currentAcademicYear = await Settings.findOne();
        if (!currentAcademicYear) {
            return next(new AppError("No current academic year found in settings", 404));
        }
        academicYear = currentAcademicYear?.academicYear;
    }

    const updated = await ClassTeacher.findOneAndUpdate(
        { academicYear, grade, gender, section },
        { $set: { teacher } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('teacher', 'employeeName employeeId');

    res.status(200).json({
        status: 'success',
        data: {
            classTeacher: updated
        }
    });
});