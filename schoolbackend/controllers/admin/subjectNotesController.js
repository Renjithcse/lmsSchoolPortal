const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const SubjectNotes = require('../../models/SubjectNotes/SubjectNotes');
const PublishedSubjectNotes = require('../../models/SubjectNotes/PublishedSubjectNotes');
const GradeSubject = require('../../models/Admin/GradeSubject');
const { uploadMultiple, deleteS3File, generatePresignedUrl } = require('../../middlewares/s3UploadMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Settings = require('../../models/Admin/Settings');


// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../../public/uploads/subject-notes');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

const fileFilter = (req, file, cb) => {
    // Allow common document formats
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError('Invalid file type. Please upload PDF, DOC, DOCX, PPT, PPTX, TXT, or image files.', 400), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Middleware to handle file uploads
exports.uploadDocuments = upload.array('documents', 5); // Allow up to 5 files

// Create a new subject note
exports.createSubjectNote = catchAsync(async (req, res, next) => {
    const { 
        title,
        description,
        academicYear, 
        grade, 
        gender, 
        section, 
        subject,
        tags,
        status = 'draft'
    } = req.body;

    // Parse documentLinks if sent as JSON string
    let documentLinks = [];
    if (req.body.documentLinks) {
        try {
            documentLinks = typeof req.body.documentLinks === 'string' 
                ? JSON.parse(req.body.documentLinks) 
                : req.body.documentLinks;
        } catch (e) {
            return next(new AppError("Invalid documentLinks format", 400));
        }
    }

    // Get academic year from settings if not provided
    let finalAcademicYear = academicYear;
    if (!finalAcademicYear) {
        const currentSettings = await Settings.findOne().populate('academicYear');
        if (!currentSettings) {
            return next(new AppError('System settings not configured', 500));
        }
        finalAcademicYear = currentSettings.academicYear?._id || currentSettings.academicYear;
    }

    // Validate required fields
    if (!title || !description || !grade || !subject) {
        return next(new AppError("Please provide title, description, grade, and subject", 400));
    }

    // For published notes, gender and section are required
    if (status === 'published' && (!gender || !section)) {
        return next(new AppError("Gender and section are required for published notes", 400));
    }

    // If gender and section are provided, verify that the subject is assigned to this class
    if (gender && section) {
        const gradeSubject = await GradeSubject.findOne({
            academicYear: finalAcademicYear,
            grade,
            gender,
            section,
            subject,
            Status: 'active'
        });

        if (!gradeSubject) {
            return next(new AppError("Subject is not assigned to this class", 400));
        }
    }

    // Process documents - can be uploaded files or links
    const documents = [];

    // Add uploaded files
    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
        const uploadedDocs = req.uploadedFiles.map(file => ({
            fileName: file.key.split('/').pop(),
            originalName: file.originalName,
            filePath: file.url,
            fileSize: file.size,
            mimeType: file.mimetype,
            s3Key: file.key,
            isLink: false
        }));
        documents.push(...uploadedDocs);
    }

    // Add document links
    if (documentLinks && Array.isArray(documentLinks) && documentLinks.length > 0) {
        const linkDocs = documentLinks
            .filter(link => link.linkUrl && link.fileName)
            .map(link => ({
                fileName: link.fileName,
                originalName: link.fileName,
                filePath: link.linkUrl,
                fileSize: 0,
                mimeType: 'application/link',
                s3Key: '',
                isLink: true,
                linkUrl: link.linkUrl
            }));
        documents.push(...linkDocs);
    }

    // Documents are optional - no validation needed

    const subjectNote = await SubjectNotes.create({
        title,
        description,
        academicYear: finalAcademicYear,
        grade,
        gender,
        section,
        subject,
        documents: documents,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        status,
        createdBy: req.user.id
    });

    // Populate the created note
    await subjectNote.populate([
        { path: 'academicYear', select: 'academicYear' },
        { path: 'grade', select: 'gradeName' },
        { path: 'section', select: 'sectionName' },
        { path: 'subject', select: 'subjectName' },
        { path: 'createdBy', select: 'name email' }
    ]);

    // Generate pre-signed URLs for documents if needed
    if (subjectNote.documents && subjectNote.documents.length > 0) {
        subjectNote.documents = subjectNote.documents.map(doc => {
            let s3Key = doc.s3Key;
            
            // If s3Key is not available, extract it from filePath
            if (!s3Key && doc.filePath && doc.filePath.includes('amazonaws.com/')) {
                const urlParts = doc.filePath.split('amazonaws.com/');
                if (urlParts.length > 1) {
                    s3Key = urlParts[1];
                }
            }
            
            return {
                ...doc.toObject(),
                downloadUrl: s3Key ? generatePresignedUrl(s3Key, 3600) : doc.filePath
            };
        });
    }

    res.status(201).json({
        status: "success",
        data: subjectNote
    });
});

// Create multiple subject notes at once
exports.createMultipleSubjectNotes = catchAsync(async (req, res, next) => {
    const { notes, classInfo } = req.body;

    if (!notes || !Array.isArray(notes) || notes.length === 0) {
        return next(new AppError("Please provide notes array", 400));
    }

    if (!classInfo || !classInfo.academicYear || !classInfo.grade || !classInfo.gender || !classInfo.section) {
        return next(new AppError("Please provide complete class information", 400));
    }

    const createdNotes = [];
    const errors = [];

    for (let i = 0; i < notes.length; i++) {
        const noteData = notes[i];
        
        try {
            // Validate required fields for each note
            if (!noteData.title || !noteData.description || !noteData.subject) {
                errors.push(`Note ${i + 1}: Missing required fields (title, description, subject)`);
                continue;
            }

            // Verify that the subject is assigned to this class
            const gradeSubject = await GradeSubject.findOne({
                academicYear: classInfo.academicYear,
                grade: classInfo.grade,
                gender: classInfo.gender,
                section: classInfo.section,
                subject: noteData.subject,
                Status: 'active'
            });

            if (!gradeSubject) {
                errors.push(`Note ${i + 1}: Subject is not assigned to this class`);
                continue;
            }

            const subjectNote = await SubjectNotes.create({
                title: noteData.title,
                description: noteData.description,
                academicYear: classInfo.academicYear,
                grade: classInfo.grade,
                gender: classInfo.gender,
                section: classInfo.section,
                subject: noteData.subject,
                tags: noteData.tags ? noteData.tags.split(',').map(tag => tag.trim()) : [],
                status: noteData.status || 'draft',
                createdBy: req.user.id
            });

            // Populate the created note
            await subjectNote.populate([
                { path: 'academicYear', select: 'academicYear' },
                { path: 'grade', select: 'gradeName' },
                { path: 'section', select: 'sectionName' },
                { path: 'subject', select: 'subjectName' },
                { path: 'createdBy', select: 'name email' }
            ]);

            createdNotes.push(subjectNote);
        } catch (error) {
            errors.push(`Note ${i + 1}: ${error.message}`);
        }
    }

    if (errors.length > 0 && createdNotes.length === 0) {
        return next(new AppError(`Failed to create notes: ${errors.join(', ')}`, 400));
    }

    res.status(201).json({
        status: "success",
        data: {
            createdNotes,
            successCount: createdNotes.length,
            totalCount: notes.length,
            errors: errors.length > 0 ? errors : null
        }
    });
});

// Get all subject notes with filters
exports.getAllSubjectNotes = catchAsync(async (req, res, next) => {
    const { 
        academicYear, 
        grade, 
        gender, 
        section, 
        subject,
        status,
        search,
        page = 1,
        limit = 10
    } = req.query;

    // Get academic year from settings if not provided
    let finalAcademicYear = academicYear;
    if (!finalAcademicYear) {
        const currentSettings = await Settings.findOne().populate('academicYear');
        if (currentSettings && currentSettings.academicYear) {
            finalAcademicYear = currentSettings.academicYear?._id || currentSettings.academicYear;
        }
    }

    const query = {};
    
    if (finalAcademicYear) query.academicYear = finalAcademicYear;
    if (grade) query.grade = grade;
    if (gender) query.gender = gender;
    if (section) query.section = section;
    if (subject) query.subject = subject;
    if (status) query.status = status;
    
    // Text search
    if (search) {
        query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    console.log({query})

    const subjectNotes = await SubjectNotes.find(query)
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('section', 'sectionName')
        .populate('subject', 'subjectName')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await SubjectNotes.countDocuments(query);

    // Get publish counts for all subject notes using aggregation
    let publishCountMap = {};
    if (subjectNotes.length > 0) {
        const noteIds = subjectNotes.map(note => note._id);
        const publishCounts = await PublishedSubjectNotes.aggregate([
            {
                $match: {
                    subjectNote: { $in: noteIds },
                    status: 'active'
                }
            },
            {
                $group: {
                    _id: '$subjectNote',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Create a map of subjectNote ID to publish count for quick lookup
        publishCounts.forEach(item => {
            publishCountMap[item._id.toString()] = item.count;
        });
    }

    // Generate pre-signed URLs for all documents and add publish count
    const subjectNotesWithUrls = subjectNotes.map(note => ({
        ...note.toObject(),
        publishCount: publishCountMap[note._id.toString()] || 0,
        documents: note.documents.map(doc => {
            let s3Key = doc.s3Key;
            
            // If s3Key is not available, extract it from filePath
            if (!s3Key && doc.filePath && doc.filePath.includes('amazonaws.com/')) {
                const urlParts = doc.filePath.split('amazonaws.com/');
                if (urlParts.length > 1) {
                    s3Key = urlParts[1];
                }
            }
            
            return {
                ...doc.toObject(),
                downloadUrl: s3Key ? generatePresignedUrl(s3Key, 3600) : doc.filePath
            };
        })
    }));

    res.status(200).json({
        status: "success",
        results: subjectNotes.length,
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        data: subjectNotesWithUrls
    });
});

// Get a specific subject note
exports.getSubjectNote = catchAsync(async (req, res, next) => {
    const subjectNote = await SubjectNotes.findById(req.params.id)
        .populate('academicYear', 'academicYear')
        .populate('grade', 'gradeName')
        .populate('section', 'sectionName')
        .populate('subject', 'subjectName')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

    if (!subjectNote) {
        return next(new AppError("No subject note found with this ID", 404));
    }

    // Get all published notes for this subject note
    const publishedNotes = await PublishedSubjectNotes.find({
        subjectNote: req.params.id,
        status: 'active'
    })
        .populate('section', 'sectionName')
        .populate('publishedBy', 'name email')
        .sort({ publishedAt: -1 });

    // Generate pre-signed URLs for uploaded documents
    const documentsWithUrls = subjectNote.documents.map(doc => {
        let s3Key = doc.s3Key;
        
        // If s3Key is not available, extract it from filePath
        if (!s3Key && doc.filePath && doc.filePath.includes('amazonaws.com/')) {
            const urlParts = doc.filePath.split('amazonaws.com/');
            if (urlParts.length > 1) {
                s3Key = urlParts[1].split('?')[0];
            }
        }
        
        return {
            ...doc.toObject(),
            downloadUrl: s3Key ? generatePresignedUrl(s3Key, 3600) : doc.filePath
        };
    });

    res.status(200).json({
        status: "success",
        data: {
            ...subjectNote.toObject(),
            documents: documentsWithUrls,
            publishCount: publishedNotes.length,
            publishedClasses: publishedNotes.map(pn => ({
                _id: pn._id,
                gender: pn.gender,
                section: pn.section,
                publishedAt: pn.publishedAt,
                publishedBy: pn.publishedBy
            }))
        }
    });
});

// Update a subject note
exports.updateSubjectNote = catchAsync(async (req, res, next) => {
    const { 
        title,
        description,
        tags,
        status
    } = req.body;

    const subjectNote = await SubjectNotes.findById(req.params.id);

    if (!subjectNote) {
        return next(new AppError("No subject note found with this ID", 404));
    }

    // Process new uploaded files (if using S3 middleware)
    const newDocuments = [];
    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
        req.uploadedFiles.forEach(file => {
            newDocuments.push({
                fileName: file.key.split('/').pop(),
                originalName: file.originalName,
                filePath: file.url,
                fileSize: file.size,
                mimeType: file.mimetype,
                s3Key: file.key
            });
        });
    }

    // Update fields
    if (title) subjectNote.title = title;
    if (description) subjectNote.description = description;
    if (tags) subjectNote.tags = tags.split(',').map(tag => tag.trim());
    if (status) subjectNote.status = status;
    
    // Add new documents to existing ones
    if (newDocuments.length > 0) {
        subjectNote.documents = [...subjectNote.documents, ...newDocuments];
    }
    
    subjectNote.updatedBy = req.user.id;

    await subjectNote.save();

    // Populate the updated note
    await subjectNote.populate([
        { path: 'academicYear', select: 'academicYear' },
        { path: 'grade', select: 'gradeName' },
        { path: 'section', select: 'sectionName' },
        { path: 'subject', select: 'subjectName' },
        { path: 'createdBy', select: 'name email' },
        { path: 'updatedBy', select: 'name email' }
    ]);

    res.status(200).json({
        status: "success",
        data: subjectNote
    });
});

// Delete a subject note
exports.deleteSubjectNote = catchAsync(async (req, res, next) => {
    const subjectNote = await SubjectNotes.findById(req.params.id);

    if (!subjectNote) {
        return next(new AppError("No subject note found with this ID", 404));
    }

    // Delete associated files from S3
    for (const doc of subjectNote.documents) {
        let s3Key = doc.s3Key;
        
        // If s3Key is not available, extract it from filePath
        if (!s3Key && doc.filePath && doc.filePath.includes('amazonaws.com/')) {
            const urlParts = doc.filePath.split('amazonaws.com/');
            if (urlParts.length > 1) {
                s3Key = urlParts[1];
            }
        }
        
        if (s3Key) {
            try {
                await deleteS3File(s3Key);
                console.log(`Successfully deleted S3 file: ${s3Key}`);
            } catch (error) {
                console.error('Error deleting S3 file:', error);
                // Continue with deletion even if S3 deletion fails
            }
        } else {
            console.warn('No S3 key found for document:', doc.fileName);
        }
    }

    await SubjectNotes.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: "success",
        data: null
    });
});

// Remove a specific document from a subject note
exports.removeDocument = catchAsync(async (req, res, next) => {
    const { id, documentId } = req.params;

    const subjectNote = await SubjectNotes.findById(id);

    if (!subjectNote) {
        return next(new AppError("No subject note found with this ID", 404));
    }

    const documentIndex = subjectNote.documents.findIndex(doc => doc._id.toString() === documentId);

    if (documentIndex === -1) {
        return next(new AppError("Document not found", 404));
    }

    const document = subjectNote.documents[documentIndex];
    
    // Delete the file from S3
    let s3Key = document.s3Key;
    
    // If s3Key is not available, extract it from filePath
    if (!s3Key && document.filePath && document.filePath.includes('amazonaws.com/')) {
        const urlParts = document.filePath.split('amazonaws.com/');
        if (urlParts.length > 1) {
            s3Key = urlParts[1];
        }
    }
    
    if (s3Key) {
        try {
            await deleteS3File(s3Key);
            console.log(`Successfully deleted S3 file: ${s3Key}`);
        } catch (error) {
            console.error('Error deleting S3 file:', error);
            // Continue with removal even if S3 deletion fails
        }
    } else {
        console.warn('No S3 key found for document:', document.fileName);
    }

    // Remove from array
    subjectNote.documents.splice(documentIndex, 1);
    subjectNote.updatedBy = req.user.id;
    
    await subjectNote.save();

    res.status(200).json({
        status: "success",
        message: "Document removed successfully"
    });
});

// Get subject notes by class and subject
exports.getSubjectNotesByClass = catchAsync(async (req, res, next) => {
    const { academicYear, grade, gender, section, subject } = req.query;

    if (!academicYear || !grade || !gender || !section || !subject) {
        return next(new AppError("Please provide academicYear, grade, gender, section, and subject", 400));
    }

    const subjectNotes = await SubjectNotes.findForClass(
        academicYear, 
        grade, 
        gender, 
        section, 
        subject, 
        'published'
    );

    res.status(200).json({
        status: "success",
        results: subjectNotes.length,
        data: subjectNotes
    });
});

// Get available subjects for subject notes based on class
exports.getAvailableSubjects = catchAsync(async (req, res, next) => {
    const { grade, gender, section } = req.query;

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

    if (!academicYear || !grade || !gender || !section) {
        return next(new AppError("Please provide academicYear, grade, gender, and section", 400));
    }

    const gradeSubjects = await GradeSubject.find({
        academicYear,
        grade,
        gender,
        section,
        Status: 'active'
    }).populate({
        path: 'subject',
        select: 'subjectName'
    }).populate({
        path: 'teacher',
        select: 'employeeName employeeId'
    });

    if (gradeSubjects.length === 0) {
        return next(new AppError("No subjects found for this class", 404));
    }

    res.status(200).json({
        status: "success",
        data: {
            subjects: gradeSubjects.map(gs => ({
                gradeSubjectId: gs._id,
                subjectId: gs.subject?._id,
                subjectName: gs.subject?.subjectName,
                teacherId: gs.teacher?._id,
                teacherName: gs.teacher?.employeeName,
                employeeId: gs.teacher?.employeeId
            }))
        }
    });
});

// Publish subject note to multiple sections
exports.publishSubjectNote = catchAsync(async (req, res, next) => {
    const noteId = req.params.noteId || req.params.id;
    const { gender, sections } = req.body; // sections is an array of section IDs

    if (!gender || !sections || !Array.isArray(sections) || sections.length === 0) {
        return next(new AppError("Please provide gender and at least one section", 400));
    }

    // Get the draft note
    const draftNote = await SubjectNotes.findById(noteId)
        .populate('academicYear')
        .populate('grade')
        .populate('subject');

    if (!draftNote) {
        return next(new AppError("Subject note not found", 404));
    }

    // Allow publishing even if note is already published (can publish to more sections)

    // Verify teacher has permission for these sections
    const Teacher = require('../../models/users/Teacher');
    const SubjectPermissions = require('../../models/Admin/SubjectPermissions');
    const Section = require('../../models/Admin/Section');

    let teacherId = req.teacherId;
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }

    if (teacherId) {
        // Check if teacher has permission for these sections
        const academicYearId = draftNote.academicYear._id || draftNote.academicYear;
        const subjectPermissions = await SubjectPermissions.find({
            academicYear: academicYearId,
            teacher: teacherId,
            grade: draftNote.grade._id || draftNote.grade,
            gender: gender
        }).select('section').lean();

        const gradeSubjects = await GradeSubject.find({
            academicYear: academicYearId,
            teacher: teacherId,
            grade: draftNote.grade._id || draftNote.grade,
            gender: gender,
            subject: draftNote.subject._id || draftNote.subject,
            Status: 'active'
        }).select('section').lean();

        const allowedSectionIds = new Set();
        if (subjectPermissions.length > 0) {
            subjectPermissions.forEach(sp => {
                const sectionId = sp.section?._id || sp.section;
                if (sectionId) allowedSectionIds.add(sectionId.toString());
            });
        }
        if (gradeSubjects.length > 0) {
            gradeSubjects.forEach(gs => {
                const sectionId = gs.section?._id || gs.section;
                if (sectionId) allowedSectionIds.add(sectionId.toString());
            });
        }

        // Filter sections to only those teacher has permission for
        const validSections = sections.filter(secId => allowedSectionIds.has(secId.toString()));
        if (validSections.length === 0) {
            return next(new AppError("You don't have permission to publish to any of the selected sections", 403));
        }
    }

    // Create published notes for each section
    const publishedNotes = [];
    const errors = [];

    for (const sectionId of sections) {
        try {
            // Check if already published to this section
            const existingPublished = await PublishedSubjectNotes.findOne({
                subjectNote: noteId,
                gender: gender,
                section: sectionId,
                status: 'active'
            });

            if (existingPublished) {
                errors.push(`Note already published to this section`);
                continue;
            }

            // Verify subject is assigned to this section
            const gradeSubject = await GradeSubject.findOne({
                academicYear: draftNote.academicYear._id || draftNote.academicYear,
                grade: draftNote.grade._id || draftNote.grade,
                gender: gender,
                section: sectionId,
                subject: draftNote.subject._id || draftNote.subject,
                Status: 'active'
            });

            if (!gradeSubject) {
                errors.push(`Subject not assigned to section ${sectionId}`);
                continue;
            }

            // Create published note record
            const publishedNote = await PublishedSubjectNotes.create({
                subjectNote: noteId,
                academicYear: draftNote.academicYear._id || draftNote.academicYear,
                grade: draftNote.grade._id || draftNote.grade,
                gender: gender,
                section: sectionId,
                subject: draftNote.subject._id || draftNote.subject,
                publishedBy: req.user.id,
                status: 'active'
            });

            await publishedNote.populate([
                { path: 'subjectNote' },
                { path: 'academicYear', select: 'academicYear' },
                { path: 'grade', select: 'gradeName' },
                { path: 'section', select: 'sectionName' },
                { path: 'subject', select: 'subjectName' },
                { path: 'publishedBy', select: 'name email' }
            ]);

            publishedNotes.push(publishedNote);
        } catch (error) {
            if (error.code === 11000) {
                errors.push(`Note already published to this section`);
            } else {
                errors.push(`Error publishing to section ${sectionId}: ${error.message}`);
            }
        }
    }

    if (publishedNotes.length === 0) {
        return next(new AppError(`Failed to publish note: ${errors.join(', ')}`, 400));
    }

    res.status(201).json({
        status: "success",
        data: {
            publishedNotes,
            publishedCount: publishedNotes.length,
            totalSections: sections.length,
            errors: errors.length > 0 ? errors : undefined
        }
    });
});

// Get available sections for publishing (based on teacher permissions)
exports.getAvailablePublishSections = catchAsync(async (req, res, next) => {
    const { grade, gender, subject, noteId } = req.query;

    if (!grade || !gender) {
        return next(new AppError("Grade and gender are required", 400));
    }

    const Teacher = require('../../models/users/Teacher');
    const SubjectPermissions = require('../../models/Admin/SubjectPermissions');
    const Section = require('../../models/Admin/Section');
    const Settings = require('../../models/Admin/Settings');

    // Get current academic year
    const currentSettings = await Settings.findOne().populate('academicYear');
    if (!currentSettings) {
        return next(new AppError("System settings not configured", 500));
    }
    const academicYearId = currentSettings.academicYear._id || currentSettings.academicYear;

    // Get already published sections for this note (if noteId is provided)
    let alreadyPublishedSectionIds = [];
    if (noteId) {
        const publishedNotes = await PublishedSubjectNotes.find({
            subjectNote: noteId,
            gender: gender,
            status: 'active'
        }).select('section').lean();

        alreadyPublishedSectionIds = publishedNotes
            .map(pn => pn.section?._id || pn.section)
            .filter(id => id)
            .map(id => id.toString());
    }

    // Subject is required to verify it's registered to sections
    if (!subject) {
        return next(new AppError("Subject is required to verify section registration", 400));
    }

    // Get teacher ID (needed for non-admin users)
    let teacherId = req.teacherId;
    if (!teacherId && req.user && req.user.role === 'user') {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (teacher) {
            teacherId = teacher._id;
        }
    }

    // Get available sections - must verify subject is registered to section via GradeSubject
    let availableSections = [];

    // Build query to find GradeSubject where subject is registered
    const gradeSubjectQuery = {
        academicYear: academicYearId,
        grade: grade,
        gender: gender,
        subject: subject,
        Status: 'active'
    };

    // If user is admin, get all sections where subject is registered
    if (req.user && req.user.role === 'admin') {
        const gradeSubjects = await GradeSubject.find(gradeSubjectQuery)
            .select('section')
            .lean();

        if (gradeSubjects.length > 0) {
            const sectionIds = gradeSubjects
                .map(gs => gs.section?._id || gs.section)
                .filter(id => id)
                .map(id => id.toString());
            availableSections = [...new Set(sectionIds)];
        }
    } else {
        // For non-admin users, check teacher permissions AND subject registration
        if (!teacherId) {
            return next(new AppError("Teacher ID not found", 401));
        }

        // Check SubjectPermissions first
        const subjectPermissions = await SubjectPermissions.find({
            academicYear: academicYearId,
            teacher: teacherId,
            grade: grade,
            gender: gender
        }).select('section').lean();

        let permissionSectionIds = [];
        if (subjectPermissions.length > 0) {
            permissionSectionIds = subjectPermissions
                .map(sp => sp.section?._id || sp.section)
                .filter(id => id)
                .map(id => id.toString());
        }

        // Get GradeSubject where subject is registered AND teacher has permission
        // Option 1: GradeSubject where teacher is assigned
        gradeSubjectQuery.teacher = teacherId;
        const gradeSubjectsWithTeacher = await GradeSubject.find(gradeSubjectQuery)
            .select('section')
            .lean();

        if (gradeSubjectsWithTeacher.length > 0) {
            const sectionIds = gradeSubjectsWithTeacher
                .map(gs => gs.section?._id || gs.section)
                .filter(id => id)
                .map(id => id.toString());
            availableSections = [...new Set(sectionIds)];
        }

        // Option 2: GradeSubject for sections from SubjectPermissions (where subject is registered)
        if (permissionSectionIds.length > 0) {
            delete gradeSubjectQuery.teacher; // Remove teacher filter for this query
            const gradeSubjectsFromPermissions = await GradeSubject.find({
                ...gradeSubjectQuery,
                section: { $in: permissionSectionIds }
            }).select('section').lean();

            if (gradeSubjectsFromPermissions.length > 0) {
                const sectionIds = gradeSubjectsFromPermissions
                    .map(gs => gs.section?._id || gs.section)
                    .filter(id => id)
                    .map(id => id.toString());
                availableSections = [...new Set([...availableSections, ...sectionIds])];
            }
        }
    }

    // Filter out already published sections
    if (alreadyPublishedSectionIds.length > 0) {
        availableSections = availableSections.filter(
            sectionId => !alreadyPublishedSectionIds.includes(sectionId)
        );
    }

    // Get section details
    const sections = await Section.find({ _id: { $in: availableSections } })
        .select('_id sectionName')
        .lean();

    res.status(200).json({
        status: "success",
        data: sections
    });
});

// Test endpoint to verify Subject Notes module is working
exports.testSubjectNotes = catchAsync(async (req, res, next) => {
    res.status(200).json({
        status: "success",
        message: "Subject Notes module is working correctly!",
        timestamp: new Date().toISOString(),
        endpoints: {
            admin: {
                create: "POST /api/v1/admin/subject-notes",
                getAll: "GET /api/v1/admin/subject-notes",
                getById: "GET /api/v1/admin/subject-notes/:id",
                update: "PATCH /api/v1/admin/subject-notes/:id",
                delete: "DELETE /api/v1/admin/subject-notes/:id",
                availableSubjects: "GET /api/v1/admin/subject-notes/available-subjects",
                publish: "POST /api/v1/admin/subject-notes/:noteId/publish",
                availablePublishSections: "GET /api/v1/admin/subject-notes/available-publish-sections"
            },
            student: {
                getAll: "GET /api/v1/student/subject-notes",
                getSubjects: "GET /api/v1/student/subject-notes/subjects",
                getBySubject: "GET /api/v1/student/subject-notes/subject/:subjectId",
                getById: "GET /api/v1/student/subject-notes/:id",
                download: "GET /api/v1/student/subject-notes/:id/documents/:documentId/download"
            }
        }
    });
});

