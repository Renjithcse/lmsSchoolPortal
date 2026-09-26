const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const SubjectNotes = require('../../models/SubjectNotes/SubjectNotes');
const PublishedSubjectNotes = require('../../models/SubjectNotes/PublishedSubjectNotes');
const Student = require('../../models/users/Student');
const AcademicStudent = require('../../models/users/AcademicStudent');
const GradeSubject = require('../../models/Admin/GradeSubject');
const Settings = require('../../models/Admin/Settings');
const { generatePresignedUrl } = require('../../middlewares/s3UploadMiddleware');
const path = require('path');
const fs = require('fs');

// Get all subject notes for a student
exports.getStudentSubjectNotes = catchAsync(async (req, res, next) => {
    let studentId = req.studentId;
    
    // If studentId is not set by middleware, try to get it from the user
    if (!studentId && req.user && req.user.role === 'student') {
        const student = await Student.findOne({ userId: req.user._id });
        if (student) {
            studentId = student._id;
        }
    }
    
    if (!studentId) {
        return next(new AppError('Student ID not found', 401));
    }

    // Get current settings (academic year and term)
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }

    const academicYearId = currentSettings.academicYear._id;

    // Get student's academic information for the current academic year (must match settings)
    const currentAcademic = await AcademicStudent.findOne({ 
        studentId: studentId,
        academicYear: academicYearId,
        status: 'active'
    }).populate('academicYear grade section');
    
    if (!currentAcademic) {
        return next(new AppError('Student academic information not found for current academic year', 404));
    }

    // Check if required populated fields exist
    if (!currentAcademic.grade || !currentAcademic.section) {
        return next(new AppError('Student academic information is incomplete', 400));
    }

    const gradeId = currentAcademic.grade._id;
    const sectionId = currentAcademic.section._id;
    const gender = currentAcademic.gender || 'male'; // Default to male if not specified

    // Get all subjects for this student's class
    const gradeSubjects = await GradeSubject.find({
        academicYear: academicYearId,
        grade: gradeId,
        gender: gender,
        section: sectionId,
        Status: 'active'
    }).populate('subject', 'subjectName');

    const subjectIds = gradeSubjects.map(gs => gs.subject._id);

    // Get published subject notes for this student's subjects
    const publishedNotes = await PublishedSubjectNotes.find({
        academicYear: academicYearId,
        grade: gradeId,
        gender: gender,
        section: sectionId,
        subject: { $in: subjectIds },
        status: 'active'
    })
        .populate({
            path: 'subjectNote',
            populate: {
                path: 'createdBy',
                select: 'name email'
            }
        })
        .populate('subject', 'subjectName')
        .sort({ publishedAt: -1 });

    // Group notes by subject and extract the actual note data
    const notesBySubject = {};
    publishedNotes.forEach(publishedNote => {
        if (!publishedNote.subjectNote) return; // Skip if subjectNote is not populated
        
        const subjectId = publishedNote.subject._id.toString();
        if (!notesBySubject[subjectId]) {
            notesBySubject[subjectId] = {
                subject: publishedNote.subject,
                notes: []
            };
        }
        
        // Use the actual subject note data but keep published date
        const noteData = publishedNote.subjectNote.toObject();
        noteData.publishedAt = publishedNote.publishedAt;
        noteData.viewCount = publishedNote.viewCount;
        
        // Ensure createdBy is populated if available
        if (publishedNote.subjectNote.createdBy && typeof publishedNote.subjectNote.createdBy === 'object') {
            noteData.createdBy = publishedNote.subjectNote.createdBy;
        }
        
        // Generate pre-signed URLs for documents if they have S3 keys
        if (noteData.documents && noteData.documents.length > 0) {
            noteData.documents = noteData.documents.map(doc => {
                let s3Key = doc.s3Key;
                
                // If s3Key is not available, extract it from filePath
                if (!s3Key && doc.filePath && doc.filePath.includes('amazonaws.com/')) {
                    const urlParts = doc.filePath.split('amazonaws.com/');
                    if (urlParts.length > 1) {
                        s3Key = urlParts[1].split('?')[0];
                    }
                }
                
                return {
                    ...doc,
                    downloadUrl: s3Key ? generatePresignedUrl(s3Key, 3600) : doc.filePath
                };
            });
        }
        
        notesBySubject[subjectId].notes.push(noteData);
    });

    res.status(200).json({
        status: 'success',
        data: {
            student: {
                name: currentAcademic.studentId?.studentName || 'Unknown',
                grade: currentAcademic.grade?.gradeName || 'Unknown',
                section: currentAcademic.section?.sectionName || 'Unknown',
                academicYear: currentSettings.academicYear?.academicYear || 'Unknown'
            },
            totalNotes: subjectNotes.length,
            totalSubjects: Object.keys(notesBySubject).length,
            notesBySubject: Object.values(notesBySubject)
        }
    });
});

// Get subject notes for a specific subject
exports.getSubjectNotesBySubject = catchAsync(async (req, res, next) => {
    const { subjectId } = req.params;
    let studentId = req.studentId;
    
    // If studentId is not set by middleware, try to get it from the user
    if (!studentId && req.user && req.user.role === 'student') {
        const student = await Student.findOne({ userId: req.user._id });
        if (student) {
            studentId = student._id;
        }
    }
    
    if (!studentId) {
        return next(new AppError('Student ID not found', 401));
    }

    // Get current settings (academic year and term)
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }

    const academicYearId = currentSettings.academicYear._id;

    // Get student's academic information for the current academic year
    const currentAcademic = await AcademicStudent.findOne({ 
        studentId: studentId,
        academicYear: academicYearId,
        status: 'active'
    }).populate('academicYear grade section');
    
    if (!currentAcademic) {
        return next(new AppError('Student academic information not found for current academic year', 404));
    }

    const gradeId = currentAcademic.grade._id;
    const sectionId = currentAcademic.section._id;
    const gender = currentAcademic.gender || 'male';

    // Verify that the student has access to this subject
    const gradeSubject = await GradeSubject.findOne({
        academicYear: academicYearId,
        grade: gradeId,
        gender: gender,
        section: sectionId,
        subject: subjectId,
        Status: 'active'
    }).populate('subject', 'subjectName');

    if (!gradeSubject) {
        return next(new AppError('You do not have access to this subject', 403));
    }

    // Get published subject notes for this subject
    const publishedNotes = await PublishedSubjectNotes.find({
        academicYear: academicYearId,
        grade: gradeId,
        gender: gender,
        section: sectionId,
        subject: subjectId,
        status: 'active'
    })
        .populate({
            path: 'subjectNote',
            populate: {
                path: 'createdBy',
                select: 'name email'
            }
        })
        .populate('subject', 'subjectName')
        .sort({ publishedAt: -1 });

    // Extract the actual note data
    const subjectNotes = publishedNotes
        .filter(pn => pn.subjectNote) // Filter out any without subjectNote
        .map(publishedNote => {
            const noteData = publishedNote.subjectNote.toObject();
            noteData.publishedAt = publishedNote.publishedAt;
            noteData.viewCount = publishedNote.viewCount;
            
            // Ensure createdBy is populated if available
            if (publishedNote.subjectNote.createdBy && typeof publishedNote.subjectNote.createdBy === 'object') {
                noteData.createdBy = publishedNote.subjectNote.createdBy;
            }
            
            // Generate pre-signed URLs for documents if they have S3 keys
            if (noteData.documents && noteData.documents.length > 0) {
                noteData.documents = noteData.documents.map(doc => {
                    let s3Key = doc.s3Key;
                    
                    // If s3Key is not available, extract it from filePath
                    if (!s3Key && doc.filePath && doc.filePath.includes('amazonaws.com/')) {
                        const urlParts = doc.filePath.split('amazonaws.com/');
                        if (urlParts.length > 1) {
                            s3Key = urlParts[1].split('?')[0];
                        }
                    }
                    
                    return {
                        ...doc,
                        downloadUrl: s3Key ? generatePresignedUrl(s3Key, 3600) : doc.filePath
                    };
                });
            }
            
            return noteData;
        });

    res.status(200).json({
        status: 'success',
        data: {
            subject: gradeSubject.subject,
            notes: subjectNotes
        }
    });
});

// Get a specific subject note and increment view count
exports.getSubjectNote = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    let studentId = req.studentId;
    
    // If studentId is not set by middleware, try to get it from the user
    if (!studentId && req.user && req.user.role === 'student') {
        const student = await Student.findOne({ userId: req.user._id });
        if (student) {
            studentId = student._id;
        }
    }
    
    if (!studentId) {
        return next(new AppError('Student ID not found', 401));
    }

    // Get current settings and student info
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }

    const academicYearId = currentSettings.academicYear._id;

    const currentAcademic = await AcademicStudent.findOne({ 
        studentId: studentId,
        academicYear: academicYearId,
        status: 'active'
    }).populate('academicYear grade section');
    
    if (!currentAcademic) {
        return next(new AppError('Student academic information not found for current academic year', 404));
    }

    const gradeId = currentAcademic.grade._id;
    const sectionId = currentAcademic.section._id;
    const gender = currentAcademic.gender || 'male';

    // Find the published note (id can be PublishedSubjectNotes _id or SubjectNotes _id from list response)
    const publishedNote = await PublishedSubjectNotes.findOne({
        academicYear: academicYearId,
        grade: gradeId,
        gender: gender,
        section: sectionId,
        status: 'active',
        $or: [
            { _id: id },
            { subjectNote: id }
        ]
    })
        .populate('subjectNote')
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('section', 'sectionName')
        .populate('subject', 'subjectName');

    if (!publishedNote || !publishedNote.subjectNote) {
        return next(new AppError('Subject note not found or you do not have access to it', 404));
    }

    // Increment view count on published note
    await publishedNote.incrementViewCount();

    // Get the actual subject note with full population
    const subjectNote = await SubjectNotes.findById(publishedNote.subjectNote._id)
        .populate([
            { path: 'academicYear', select: 'academicYear' },
            { path: 'grade', select: 'gradeName' },
            { path: 'section', select: 'sectionName' },
            { path: 'subject', select: 'subjectName' },
            { path: 'createdBy', select: 'name email' }
        ]);

    // Merge published note metadata with subject note
    const noteData = subjectNote.toObject();
    noteData.publishedAt = publishedNote.publishedAt;
    noteData.viewCount = publishedNote.viewCount;
    noteData.lastViewedAt = publishedNote.lastViewedAt;
    noteData.publishedGender = publishedNote.gender;
    noteData.publishedSection = publishedNote.section;
    
    // Generate pre-signed URLs for documents if they have S3 keys
    if (noteData.documents && noteData.documents.length > 0) {
        noteData.documents = noteData.documents.map(doc => {
            let s3Key = doc.s3Key;
            
            // If s3Key is not available, extract it from filePath
            if (!s3Key && doc.filePath && doc.filePath.includes('amazonaws.com/')) {
                const urlParts = doc.filePath.split('amazonaws.com/');
                if (urlParts.length > 1) {
                    s3Key = urlParts[1].split('?')[0];
                }
            }
            
            return {
                ...doc,
                downloadUrl: s3Key ? generatePresignedUrl(s3Key, 3600) : doc.filePath
            };
        });
    }

    res.status(200).json({
        status: 'success',
        data: noteData
    });
});

// Download a document from subject notes
exports.downloadDocument = catchAsync(async (req, res, next) => {
    const { id, documentId } = req.params;
    let studentId = req.studentId;


    console.log({studentId});
    // If studentId is not set by middleware, try to get it from the user
    if (!studentId && req.user && req.user.role === 'student') {
        const student = await Student.findOne({ userId: req.user._id });
        if (student) {
            studentId = student._id;
        }
    }
    
    if (!studentId) {
        return next(new AppError('Student ID not found', 401));
    }

    // Get current settings and student info
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }

    const academicYearId = currentSettings.academicYear._id;

    const currentAcademic = await AcademicStudent.findOne({ 
        studentId: studentId,
        academicYear: academicYearId,
        status: 'active'
    }).populate('academicYear grade section');
    
    if (!currentAcademic) {
        return next(new AppError('Student academic information not found for current academic year', 404));
    }

    const gradeId = currentAcademic.grade._id;
    const sectionId = currentAcademic.section._id;
    const gender = currentAcademic.gender || 'male';

    // Find the published note and verify access (id can be PublishedSubjectNotes _id or SubjectNotes _id)
    const publishedNote = await PublishedSubjectNotes.findOne({
        academicYear: academicYearId,
        grade: gradeId,
        gender: gender,
        section: sectionId,
        status: 'active',
        $or: [
            { _id: id },
            { subjectNote: id }
        ]
    }).populate('subjectNote');

    if (!publishedNote || !publishedNote.subjectNote) {
        return next(new AppError('Subject note not found or you do not have access to it', 404));
    }

    // Get the actual subject note
    const subjectNote = await SubjectNotes.findById(publishedNote.subjectNote._id);

    if (!subjectNote) {
        return next(new AppError('Subject note not found', 404));
    }

    // Find the document
    const document = subjectNote.documents.find(doc => doc._id.toString() === documentId);

    if (!document) {
        return next(new AppError('Document not found', 404));
    }

    // Check if document has S3 key (S3 file)
    let s3Key = document.s3Key;
    
    // If s3Key is not available, extract it from filePath
    if (!s3Key && document.filePath && document.filePath.includes('amazonaws.com/')) {
        const urlParts = document.filePath.split('amazonaws.com/');
        if (urlParts.length > 1) {
            s3Key = urlParts[1].split('?')[0];
        }
    }

    // If it's an S3 file, redirect to pre-signed URL
    if (s3Key) {
        const downloadUrl = generatePresignedUrl(s3Key, 3600); // 1 hour expiry
        return res.redirect(downloadUrl);
    }

    // Otherwise, handle local file
    if (!document.filePath) {
        return next(new AppError('File path not found', 404));
    }

    const filePath = path.join(__dirname, '../../public', document.filePath);
    
    if (!fs.existsSync(filePath)) {
        return next(new AppError('File not found on server', 404));
    }

    // Set appropriate headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Length', document.fileSize);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
});

// Get student's subjects with notes count
exports.getStudentSubjectsWithNotes = catchAsync(async (req, res, next) => {
    let studentId = req.studentId;

    console.log({studentId});
    
    // If studentId is not set by middleware, try to get it from the user
    if (!studentId && req.user && req.user.role === 'student') {
        const student = await Student.findOne({ userId: req.user._id });
        if (student) {
            studentId = student._id;
        }
    }
    
    if (!studentId) {
        return next(new AppError('Student ID not found', 401));
    }

    // Get current settings (academic year and term)
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError('System settings not configured', 500));
    }

    const academicYearId = currentSettings.academicYear._id;

    // Get student's academic information for the current academic year (must match settings)
    const currentAcademic = await AcademicStudent.findOne({ 
        studentId: studentId,
        academicYear: academicYearId,
        status: 'active'
    }).populate('academicYear grade section studentId');
    
    if (!currentAcademic) {
        return next(new AppError('Student academic information not found for current academic year', 404));
    }

    console.log({currentAcademic});

    const gradeId = currentAcademic.grade._id;
    const sectionId = currentAcademic.section._id;
    const gender = currentAcademic.gender || 'male';

    // Get all subjects for this student's class
    const gradeSubjects = await GradeSubject.find({
        academicYear: academicYearId,
        grade: gradeId,
        gender: gender,
        section: sectionId,
        Status: 'active'
    }).populate('subject', 'subjectName')
      .populate('teacher', 'employeeName employeeId');

    console.log({gradeSubjects: JSON.stringify(gradeSubjects)});

    // Get notes count for each subject from PublishedSubjectNotes
    const subjectsWithNotes = await Promise.all(
        gradeSubjects.map(async (gradeSubject) => {
            const notesCount = await PublishedSubjectNotes.countDocuments({
                academicYear: academicYearId,
                grade: gradeId,
                gender: gender,
                section: sectionId,
                subject: gradeSubject.subject._id,
                status: 'active'
            });

            return {
                gradeSubjectId: gradeSubject._id,
                subject: gradeSubject.subject,
                teacher: gradeSubject.teacher,
                notesCount
            };
        })
    );

    res.status(200).json({
        status: 'success',
        data: {
            student: {
                name: currentAcademic.studentId?.studentName || 'Unknown',
                grade: currentAcademic.grade?.gradeName || 'Unknown',
                section: currentAcademic.section?.sectionName || 'Unknown',
                academicYear: currentSettings.academicYear?.academicYear || 'Unknown'
            },
            subjects: subjectsWithNotes
        }
    });
});

