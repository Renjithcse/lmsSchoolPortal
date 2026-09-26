const TermHistory = require('../../models/Admin/TermHistory');
const AcademicYear = require('../../models/Admin/AcademicYear');
const Setting = require('../../models/Admin/Settings');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');

// Create a new term history
exports.createTermHistory = catchAsync(async (req, res) => {
    // Add user info to request body
    req.body.createdBy = req.user.id;
    
    // Validate academic year exists
    const academicYear = await AcademicYear.findById(req.body.academicYear);
    if (!academicYear) {
        return res.status(400).json({ 
            message: 'Academic year not found' 
        });
    }

    // Check if term already exists for this academic year
    const existingTerm = await TermHistory.findOne({
        academicYear: req.body.academicYear,
        term: req.body.term
    });

    if (existingTerm) {
        return res.status(400).json({ 
            message: `Term '${req.body.term}' already exists for this academic year` 
        });
    }

    // Check for date conflicts
    const conflictingTerm = await TermHistory.findOne({
        academicYear: req.body.academicYear,
        $or: [
            {
                startDate: { $lte: req.body.endDate },
                endDate: { $gte: req.body.startDate }
            }
        ]
    });

    if (conflictingTerm) {
        return res.status(400).json({ 
            message: 'Date range conflicts with existing term' 
        });
    }

    const termHistory = new TermHistory(req.body);
    await termHistory.save();
    
    // If term is set as active, update Settings and deactivate other terms
    if (req.body.isActive === true) {
        // Deactivate all other terms
        await TermHistory.updateMany(
            { _id: { $ne: termHistory._id } },
            { isActive: false }
        );
        
        // Update Settings with term name and academic year
        const setting = await Setting.findOne();
        // Extract academicYear ID (handle both populated and non-populated cases)
        const academicYearId = termHistory.academicYear._id || termHistory.academicYear;
        if (setting) {
            setting.term = termHistory.term;
            setting.academicYear = academicYearId;
            await setting.save();
        } else {
            // If no setting exists, create one
            await Setting.create({
                academicYear: academicYearId,
                term: termHistory.term
            });
        }
    }
    
    // Populate academic year name
    await termHistory.populate('academicYear', 'academicYear');
    
    res.status(201).json({
        status: 'success',
        message: 'Term history created successfully',
        data: termHistory
    });
});

// Get all term histories with pagination and filters
exports.getTermHistories = catchAsync(async (req, res) => {
    // Build filter object
    const filter = {};
    
    if (req.query.academicYear) {
        filter.academicYear = req.query.academicYear;
    }
    
    if (req.query.term) {
        filter.term = { $regex: req.query.term, $options: 'i' };
    }
    
    

    // Get all term histories with simple query
    const termHistories = await TermHistory.find(filter)
        .populate('academicYear', 'academicYear')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ createdAt: -1 });

    // Calculate status and duration for each term history
    const termHistoriesWithStatus = termHistories.map(termHistory => {
        const now = new Date();
        const startDate = new Date(termHistory.startDate);
        const endDate = new Date(termHistory.endDate);
        
        let status = 'Completed';
        if (now < startDate) {
            status = 'Upcoming';
        } else if (now >= startDate && now <= endDate) {
            status = 'Active';
        }

        const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

        return {
            ...termHistory.toObject(),
            status,
            duration,
            academicYearName: termHistory.academicYear?.academicYear || 'N/A'
        };
    });

    // Apply status filter if provided
    let filteredTermHistories = termHistoriesWithStatus;
    if (req.query.status) {
        filteredTermHistories = termHistoriesWithStatus.filter(th => th.status === req.query.status);
    }

    // Apply pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const paginatedTermHistories = filteredTermHistories.slice(skip, skip + limit);
    const total = filteredTermHistories.length;

    console.log('Backend: Term histories query result:', {
        filter,
        termHistoriesCount: paginatedTermHistories.length,
        total,
        page,
        limit
    });

    res.status(200).json({
        status: 'success',
        message: 'Term histories retrieved successfully',
        data: {
            termHistories: paginatedTermHistories,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
});

// Get a single term history by ID
exports.getTermHistoryById = catchAsync(async (req, res) => {
    const termHistory = await TermHistory.findById(req.params.id)
        .populate('academicYear', 'academicYear')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

    if (!termHistory) {
        return res.status(404).json({ 
            message: 'Term history not found' 
        });
    }

    res.status(200).json({
        status: 'success',
        message: 'Term history retrieved successfully',
        data: termHistory
    });
});

// Update a term history by ID
exports.updateTermHistory = catchAsync(async (req, res) => {
    // Add user info to request body
    req.body.updatedBy = req.user.id;
    
    // Check if term history exists
    const existingTermHistory = await TermHistory.findById(req.params.id);
    if (!existingTermHistory) {
        return res.status(404).json({ 
            message: 'Term history not found' 
        });
    }

    // If academic year is being updated, validate it exists
    if (req.body.academicYear) {
        const academicYear = await AcademicYear.findById(req.body.academicYear);
        if (!academicYear) {
            return res.status(400).json({ 
                message: 'Academic year not found' 
            });
        }
    }

    // Check for term name conflicts (excluding current record)
    if (req.body.term) {
        const conflictingTerm = await TermHistory.findOne({
            _id: { $ne: req.params.id },
            academicYear: req.body.academicYear || existingTermHistory.academicYear,
            term: req.body.term
        });

        if (conflictingTerm) {
            return res.status(400).json({ 
                message: `Term '${req.body.term}' already exists for this academic year` 
            });
        }
    }

    // Check for date conflicts (excluding current record)
    if (req.body.startDate || req.body.endDate) {
        const startDate = req.body.startDate || existingTermHistory.startDate;
        const endDate = req.body.endDate || existingTermHistory.endDate;

        const conflictingTerm = await TermHistory.findOne({
            _id: { $ne: req.params.id },
            academicYear: req.body.academicYear || existingTermHistory.academicYear,
            $or: [
                {
                    startDate: { $lte: endDate },
                    endDate: { $gte: startDate }
                }
            ]
        });

        if (conflictingTerm) {
            return res.status(400).json({ 
                message: 'Date range conflicts with existing term' 
            });
        }
    }

    const termHistory = await TermHistory.findByIdAndUpdate(
        req.params.id, 
        req.body, 
        { new: true, runValidators: true }
    ).populate('academicYear', 'academicYear');

    // If term is being set as active, update Settings and deactivate other terms
    if (req.body.isActive === true) {
        // Deactivate all other terms
        await TermHistory.updateMany(
            { _id: { $ne: req.params.id } },
            { isActive: false }
        );
        
        // Update Settings with term name and academic year
        const setting = await Setting.findOne();
        // Extract academicYear ID (handle both populated and non-populated cases)
        const academicYearId = termHistory.academicYear._id || termHistory.academicYear;
        if (setting) {
            setting.term = termHistory.term;
            setting.academicYear = academicYearId;
            await setting.save();
        } else {
            // If no setting exists, create one
            await Setting.create({
                academicYear: academicYearId,
                term: termHistory.term
            });
        }
    }

    res.status(200).json({
        status: 'success',
        message: 'Term history updated successfully',
        data: termHistory
    });
});

// Delete a term history by ID
exports.deleteTermHistory = catchAsync(async (req, res) => {
    const termHistory = await TermHistory.findById(req.params.id);
    
    if (!termHistory) {
        return res.status(404).json({ 
            message: 'Term history not found' 
        });
    }

    // Check if term is currently active
    if (termHistory.isActive) {
        return res.status(400).json({ 
            message: 'Cannot delete an active term. Please deactivate it first.' 
        });
    }

    // Check if term is in the future (upcoming)
    const now = new Date();
    if (termHistory.startDate > now) {
        return res.status(400).json({ 
            message: 'Cannot delete an upcoming term.' 
        });
    }

    await TermHistory.findByIdAndDelete(req.params.id);

    res.status(200).json({
        status: 'success',
        message: 'Term history deleted successfully'
    });
});

// Get active term
exports.getActiveTerm = catchAsync(async (req, res) => {
    const activeTerm = await TermHistory.findOne({ isActive: true })
        .populate('academicYear', 'academicYear');

    if (!activeTerm) {
        return res.status(404).json({
            message: 'No active term found'
        });
    }

    res.status(200).json({
        status: 'success',
        message: 'Active term retrieved successfully',
        data: activeTerm
    });
});

// Set term as active
exports.setActiveTerm = catchAsync(async (req, res) => {
    const termHistory = await TermHistory.findById(req.params.id);
    
    if (!termHistory) {
        return res.status(404).json({ 
            message: 'Term history not found' 
        });
    }

    // Deactivate all other terms
    await TermHistory.updateMany(
        { _id: { $ne: req.params.id } },
        { isActive: false }
    );

    // Activate the selected term
    termHistory.isActive = true;
    termHistory.updatedBy = req.user.id;
    await termHistory.save();

    // Update Settings with term name and academic year
    const setting = await Setting.findOne();
    if (setting) {
        setting.term = termHistory.term;
        setting.academicYear = termHistory.academicYear;
        await setting.save();
    } else {
        // If no setting exists, create one
        await Setting.create({
            academicYear: termHistory.academicYear,
            term: termHistory.term
        });
    }

    res.status(200).json({
        status: 'success',
        message: 'Term activated successfully',
        data: termHistory
    });
});

// Get terms by academic year
exports.getTermsByAcademicYear = catchAsync(async (req, res) => {
    const { academicYearId } = req.params;
    
    const terms = await TermHistory.find({ academicYear: academicYearId })
        .populate('academicYear', 'academicYear')
        .sort({ startDate: 1 });

    res.status(200).json({
        status: 'success',
        message: 'Terms retrieved successfully',
        data: terms
    });
});

// Get current term (based on current date)
exports.getCurrentTerm = catchAsync(async (req, res) => {
    const now = new Date();
    
    const currentTerm = await TermHistory.findOne({
        startDate: { $lte: now },
        endDate: { $gte: now }
    }).populate('academicYear', 'academicYear');

    if (!currentTerm) {
        return res.status(404).json({
            message: 'No current term found'
        });
    }

    res.status(200).json({
        status: 'success',
        message: 'Current term retrieved successfully',
        data: currentTerm
    });
});
