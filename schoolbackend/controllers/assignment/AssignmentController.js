const Assignment = require("../../models/Assignments/Assignment");
const PublishAssignment = require("../../models/Assignments/Publish");
const AppError = require('../../utils/appError');
const Settings = require("../../models/Admin/Settings");
const { uploadToS3, deleteS3File } = require('../../middlewares/s3UploadMiddleware');

const SUPPORTING_DOCS_FOLDER = "assignments/supporting";

const parseBase64DataUrl = (payload) => {
    if (!payload || typeof payload !== 'string') {
        return null;
    }
    const matches = payload.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        return null;
    }
    return {
        mimeType: matches[1],
        data: matches[2],
    };
};

const buildSupportingDocsFromUploads = (uploadedFiles = []) => {
    if (!Array.isArray(uploadedFiles) || uploadedFiles.length === 0) {
        return [];
    }

    return uploadedFiles.map((file) => ({
        fileName: file.originalName,
        filePath: file.url,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
        s3Key: file.key,
    }));
};

const buildSupportingDocsFromBody = async (documents = []) => {
    const parsedFiles = [];
    if (!Array.isArray(documents) || documents.length === 0) {
        return parsedFiles;
    }

    for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        const parsed = parseBase64DataUrl(doc?.data);
        if (!parsed) {
            continue;
        }

        const buffer = Buffer.from(parsed.data, 'base64');
        const uploadResult = await uploadToS3({
            originalname: doc?.fileName || `supporting-${Date.now()}-${i}`,
            buffer,
            mimetype: parsed.mimeType,
        }, SUPPORTING_DOCS_FOLDER);

        parsedFiles.push({
            fileName: doc?.fileName || uploadResult.originalName,
            filePath: uploadResult.url,
            mimeType: uploadResult.mimetype,
            uploadedAt: new Date(),
            s3Key: uploadResult.key,
        });
    }

    return parsedFiles;
};

const gatherSupportingDocuments = async (req) => {
    const uploadedFiles = buildSupportingDocsFromUploads(req.uploadedFiles);
    const bodyDocuments = await buildSupportingDocsFromBody(req.body.supportingDocuments);
    return [...uploadedFiles, ...bodyDocuments];
};

const normalizeRemovedSupportingDocuments = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }
    return [];
};


//Get All Assignments under academicYear, grade, term and subjectId
exports.getAllAssignments = async (req, res, next) => {
    //get the gradeId and subjectId from the query
    // const { gradeId, subjectId } = req.query;

    //populate academicYear and term from settings
    const settings = await Settings.findOne().select('academicYear term');
    if (settings) {
        if (!req.query.academicYear && settings.academicYear) {
            req.query.academicYear = settings.academicYear;
        }
        if (!req.query.term && settings.term) {
            req.query.term = settings.term;
        }
    }
    try {
        const assignments = await Assignment.find({
            ...req.query,
            status: "active",
        }).populate({
            path: 'createdBy',
            select: "name",
        });

        const assignmentsWithPublishCount = await Promise.all(assignments.map(async (assignment) => {
            const publishCount = await PublishAssignment.countDocuments({ assignment: assignment._id });
            const assignmentObj = assignment.toObject ? assignment.toObject() : assignment;
            return {
                ...assignmentObj,
                publishCount,
            };
        }));

        res.status(200).json({
            status: "success",
            data: assignmentsWithPublishCount,
        });
    } catch (error) {
        next(new AppError( "Server Error", 500));
    }
};

//Create new Assignment
exports.createAssignment = async (req, res, next) => {
    try {
        const { academicYear, assignmentName, grade, question, subjectId, term, supportingNotes } = req.body;

        let finalAcademicYear = academicYear;
        let finalTerm = term;

        //if academicYear is not provided, use the current academic year
        if (!academicYear || !term) {
            const settings = await Settings.findOne().select('academicYear term');
            if (settings) {
                finalAcademicYear = settings.academicYear;
                finalTerm = settings.term;
            }
        }

        const questionUpload = req.uploadedFile;
        console.log(questionUpload);
        const supportingDocs = await gatherSupportingDocuments(req);
        console.log(supportingDocs);

        const newAssignment = await Assignment.create({
            assignmentName,
            academicYear: finalAcademicYear,
            grade,
            term: finalTerm,
            subjectId,
            question: question,
            questionFile: questionUpload?.url,
            questionFileS3Key: questionUpload?.key,
            supportingNotes: supportingNotes || '',
            supportingDocuments: supportingDocs,
            status: 'active',
            createdBy: req.user.id,
        });

        res.status(201).json({
            status: "success",
            data: newAssignment,
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((val) => val.message);
            return res.status(400).json({
                status: "error",
                message: messages,
            });
        } else {
            next(new AppError(error.message || "Server Error", 500));
        }
    }
};

//Update an Assignment by ID
exports.updateAssignment = async (req, res, next) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({
                status: "error",
                message: "Assignment not found",
            });
        }

        if (req.uploadedFile) {
            req.body.questionFile = req.uploadedFile.url;
            req.body.questionFileS3Key = req.uploadedFile.key;
        }

        const removedSupportingDocumentIds = normalizeRemovedSupportingDocuments(req.body.removedSupportingDocuments);
        if (req.body.removedSupportingDocuments) {
            delete req.body.removedSupportingDocuments;
        }
        let existingSupportingDocs = Array.isArray(assignment.supportingDocuments) ? [...assignment.supportingDocuments] : [];
        if (removedSupportingDocumentIds.length) {
            const toRemove = existingSupportingDocs.filter((doc) =>
                removedSupportingDocumentIds.includes(String(doc._id))
            );
            for (const doc of toRemove) {
                if (doc?.s3Key) {
                    try {
                        await deleteS3File(doc.s3Key);
                    } catch (error) {
                        console.error('Failed to delete supporting document from S3:', error.message);
                    }
                }
            }
            existingSupportingDocs = existingSupportingDocs.filter(
                (doc) => !removedSupportingDocumentIds.includes(String(doc._id))
            );
        }

        const newSupportingDocs = await gatherSupportingDocuments(req);
        const finalSupportingDocs = [...existingSupportingDocs, ...newSupportingDocs];
        if (finalSupportingDocs.length > 0) {
            req.body.supportingDocuments = finalSupportingDocs;
        } else if (removedSupportingDocumentIds.length) {
            req.body.supportingDocuments = [];
        } else {
            delete req.body.supportingDocuments;
        }

        const updatedAssignment = await Assignment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedAssignment) {
            return res.status(404).json({
                status: "error",
                message: "Assignment not found",
            });
        }

        res.status(200).json({
            status: "success",
            data: updatedAssignment,
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((val) => val.message);
            return res.status(400).json({
                status: "error",
                message: messages,
            });
        } else {
            next(new AppError("Server Error", 500));
        }
    }
};

//Delete an Assignment by ID
exports.deleteAssignment = async (req, res, next) => {
    try {
        const assignmentId = req.params.id;

        // First, check if the assignment exists
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({
                status: "error",
                message: "Assignment not found",
            });
        }

        // Check if there are any published assignments using this assignment
        const publishedAssignments = await PublishAssignment.find({ assignment: assignmentId });
        if (publishedAssignments.length > 0) {
            return res.status(400).json({
                status: "error",
                message: `Cannot delete assignment. This assignment has been published ${publishedAssignments.length} time(s). Please delete the published assignments first.`,
            });
        }

        // Delete S3 files associated with the assignment
        if (assignment.questionFileS3Key) {
            try {
                await deleteS3File(assignment.questionFileS3Key);
            } catch (error) {
                console.error('Failed to delete question file from S3:', error.message);
            }
        }

        if (Array.isArray(assignment.supportingDocuments)) {
            for (const doc of assignment.supportingDocuments) {
                if (doc?.s3Key) {
                    try {
                        await deleteS3File(doc.s3Key);
                    } catch (error) {
                        console.error('Failed to delete supporting doc from S3:', error.message);
                    }
                }
            }
        }

        // If no published assignments exist, proceed with deletion
        await Assignment.findByIdAndDelete(assignmentId);

        res.status(200).json({
            status: "success",
            data: null,
        });
    } catch (error) {
        next(new AppError("Server Error", 500));
    }
};

//View Single Assignment
exports.viewAssignment = async (req, res, next) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({
                status: "error",
                message: "Assignment not found",
            });
        }

        //get All Published Assignments
        const publishedAssignments = await PublishAssignment.find({ assignment: req.params.id }).populate('section', '_id, sectionName')

        //assignment.publishedAssignments = publishedAssignments;

        res.status(200).json({
            status: "success",
            data: {
                assignment,
                publishedAssignments,
            },
        });

        
    } catch (error) {
        next(new AppError("Server Error", 500));
    }
};
