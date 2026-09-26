const GroupSubject = require('../../models/Admin/GroupSubject');
const GradeSubject = require('../../models/Admin/GradeSubject');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');
const Settings = require('../../models/Admin/Settings');

// Create a new GroupSubject
exports.createGroupSubject = catchAsync(async (req, res, next) => {
    if(!req?.body?.academicYear){
        //Get Current Academic Year from Settings
        const currentAcademicYear = await Settings.findOne();

        if(!currentAcademicYear){
            return next(new AppError("No current academic year found in settings", 404));
        }

        req.body.academicYear = currentAcademicYear?.academicYear
    }
    const groupSubject = await GroupSubject.create(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            groupSubject
        }
    });
});

// Get all GroupSubjects
exports.getGroupSubjects = catchAsync(async (req, res, next) => {
    let filters = {};
    if (req.query) {
        filters = { ...req.query, status: 'active' };
    }

    const groupSubjects = await GroupSubject.find(filters)
      .populate("subjects");

    res.status(200).json({
        status: 'success',
        results: groupSubjects.length,
        data: groupSubjects
    });
});

// List all GradeSubjects not allocated on the GroupSubjects
exports.getUnallocatedGradeSubjects = catchAsync(async (req, res, next) => {
    let filters = {};
    if (req.query) {
        filters = { ...req.query, status: 'active' };
    }

    
    // Find all GradeSubjects that are allocated in any group
    const allocatedSubjects = await GroupSubject.find(filters, 'subjects');

    

    const allocatedSubjectIds = allocatedSubjects.flatMap(group => group.subjects) || {}


    delete filters.status;

    // Find all GradeSubjects not included in any allocated subjects
    const unallocatedGradeSubjects = await GradeSubject.find({
       _id: { $nin: allocatedSubjectIds },
        ...filters,
        type: 'group',
        Status: 'active'
    })
    .populate('subject'); // Assuming GradeSubject has a 'subject' ref

    res.status(200).json({
        status: 'success',
        results: unallocatedGradeSubjects.length,
        data: unallocatedGradeSubjects
    });
});

// Get a single GroupSubject by ID
exports.getGroupSubjectById = catchAsync(async (req, res, next) => {
    const groupSubject = await GroupSubject.findById(req.params.id)
      .populate('academicYear', 'academicYear')
      .populate('Grade', 'gradeName')
      .populate('section', 'sectionName')
      .populate({
          path: 'subjects',
          select: 'subject',
          populate: { path: 'subject' } // Assuming GradeSubject has a 'subject' ref
      });

    if (!groupSubject) {
        return next(new AppError('No group subject found with that ID'));
    }

    res.status(200).json({
        status: 'success',
        data: {
            groupSubject
        }
    });
});

// Update a GroupSubject
exports.updateGroupSubject = catchAsync(async (req, res, next) => {
    const groupSubject = await GroupSubject.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!groupSubject) {
        return next(new AppError('No group subject found with that ID'));
    }

    res.status(200).json({
        status: 'success',
        data: {
            groupSubject
        }
    });
});

// Delete a GroupSubject
exports.deleteGroupSubject = catchAsync(async (req, res, next) => {
    const groupSubject = await GroupSubject.findByIdAndDelete(req.params.id);

    if (!groupSubject) {
        return next(new AppError('No group subject found with that ID'));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Check group subject registration status across all genders and sections
exports.checkGroupSubjectCopyStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    
    // Get the group subject with its subjects
    const sourceGroupSubject = await GroupSubject.findById(id)
        .populate('grade', 'gradeName')
        .populate('academicYear', 'academicYear')
        .populate('section', 'sectionName')
        .populate('subjects');

    if (!sourceGroupSubject) {
        return next(new AppError('No group subject found with that ID', 404));
    }

    const Section = require('../../models/Admin/Section');
    
    // Get all active sections (sections are not grade-specific in this model)
    const allSections = await Section.find({ status: 'active' });

    const genders = ['male', 'female'];
    const sourceSubjectIds = sourceGroupSubject.subjects.map(sub => sub._id.toString()).sort();

    const result = {
        sourceGroupSubject: {
            groupName: sourceGroupSubject.groupName,
            grade: sourceGroupSubject.grade.gradeName,
            academicYear: sourceGroupSubject.academicYear.academicYear,
            gender: sourceGroupSubject.gender,
            section: sourceGroupSubject.section.sectionName,
            subjects: sourceGroupSubject.subjects.map(sub => ({
                _id: sub._id,
                subjectName: sub.subjectName || 'Unknown'
            }))
        },
        statusByGenderSection: []
    };

    // Check each gender-section combination
    for (const gender of genders) {
        for (const section of allSections) {
            // Find if there's a group subject with the same subjects for this gender-section
            const existingGroupSubject = await GroupSubject.findOne({
                academicYear: sourceGroupSubject.academicYear,
                grade: sourceGroupSubject.grade._id,
                gender: gender,
                section: section._id,
                status: 'active'
            }).populate('subjects');

            let isRegistered = false;
            let matchingGroupSubject = null;

            if (existingGroupSubject) {
                const existingSubjectIds = existingGroupSubject.subjects
                    .map(sub => sub._id.toString())
                    .sort();
                
                // Check if subjects match (same subjects in same order)
                isRegistered = JSON.stringify(sourceSubjectIds) === JSON.stringify(existingSubjectIds);
                
                if (isRegistered) {
                    matchingGroupSubject = {
                        _id: existingGroupSubject._id,
                        groupName: existingGroupSubject.groupName
                    };
                }
            }

            result.statusByGenderSection.push({
                gender: gender,
                section: {
                    _id: section._id,
                    sectionName: section.sectionName
                },
                isRegistered: isRegistered,
                groupSubject: matchingGroupSubject
            });
        }
    }

    res.status(200).json({
        status: 'success',
        data: result
    });
});

// Copy group subject to multiple sections
exports.copyGroupSubjectToSections = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { sections } = req.body; // Array of { gender, sectionId } objects
    
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
        return next(new AppError('Please provide sections to copy to', 400));
    }

    // Get the source group subject
    const sourceGroupSubject = await GroupSubject.findById(id)
        .populate('grade', 'gradeName')
        .populate('academicYear', 'academicYear')
        .populate('section', 'sectionName')
        .populate('subjects');

    if (!sourceGroupSubject) {
        return next(new AppError('No group subject found with that ID', 404));
    }

    const createdGroupSubjects = [];
    const errors = [];

    // Create group subjects for each selected section
    for (const sectionData of sections) {
        try {
            // Check if group subject already exists for this combination
            const existing = await GroupSubject.findOne({
                academicYear: sourceGroupSubject.academicYear,
                grade: sourceGroupSubject.grade._id,
                gender: sectionData.gender,
                section: sectionData.sectionId,
                status: 'active'
            }).populate('subjects');

            if (existing) {
                // Check if subjects match
                const existingSubjectIds = existing.subjects.map(s => s._id.toString()).sort();
                const sourceSubjectIds = sourceGroupSubject.subjects.map(s => s._id.toString()).sort();
                
                if (JSON.stringify(existingSubjectIds) === JSON.stringify(sourceSubjectIds)) {
                    errors.push({
                        gender: sectionData.gender,
                        sectionId: sectionData.sectionId,
                        message: 'Group subject with same subjects already exists'
                    });
                    continue;
                }
            }

            // Create new group subject
            const newGroupSubject = await GroupSubject.create({
                academicYear: sourceGroupSubject.academicYear,
                grade: sourceGroupSubject.grade._id,
                gender: sectionData.gender,
                section: sectionData.sectionId,
                groupName: sourceGroupSubject.groupName,
                subjects: sourceGroupSubject.subjects.map(s => s._id),
                status: 'active'
            });

            createdGroupSubjects.push(newGroupSubject);
        } catch (error) {
            errors.push({
                gender: sectionData.gender,
                sectionId: sectionData.sectionId,
                message: error.message || 'Failed to create group subject'
            });
        }
    }

    res.status(200).json({
        status: 'success',
        data: {
            created: createdGroupSubjects.length,
            createdGroupSubjects,
            errors: errors.length > 0 ? errors : undefined
        }
    });
});



