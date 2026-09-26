const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const Setting = require('../../models/Admin/Settings');
const TermHistory = require('../../models/Admin/TermHistory');

//Create a new Setting
exports.createSetting = catchAsync(async (req, res, next) => {
    const { academicYear, term, librarySettings, schoolTimings, attendanceSettings } = req?.body;


    if (!academicYear ||!term) {
        return next(new AppError("Please provide academic year and term", 400));
    }

    const setting = await Setting.create({
        academicYear,
        term,
        librarySettings,
        schoolTimings,
        attendanceSettings
    });

    res.status(201).json({
        status: "success",
        data: setting
    });

});

// Update Existing Setting
exports.updateSetting = catchAsync(async (req, res, next) => {
    const { academicYear, term, librarySettings, schoolTimings, attendanceSettings } = req?.body;

    const setting = await Setting.findById(req?.params.id);

    if(!setting) {
        return next(new AppError("No setting found with this ID", 404));
    }

    // Store old values before updating
    const oldTerm = setting.term;
    const oldAcademicYear = setting.academicYear;
    const newAcademicYear = academicYear || setting.academicYear;

    //Update existing setting
    if (academicYear) setting.academicYear = academicYear;
    if (term) setting.term = term;
    if (librarySettings) {
        setting.librarySettings = librarySettings;
    }
    if (schoolTimings) {
        setting.schoolTimings = schoolTimings;
    }
    if (attendanceSettings) {
        if (attendanceSettings.modificationTime) {
            if (!setting.attendanceSettings) {
                setting.attendanceSettings = {};
            }
            setting.attendanceSettings.modificationTime = attendanceSettings.modificationTime;
        }
    }

    await setting.save();

    // If term is updated, also update the corresponding term history
    if (term && term !== oldTerm) {
        // Find term history matching the new term name and academic year
        let termHistory = await TermHistory.findOne({
            academicYear: newAcademicYear,
            term: term
        });

        // If no term history found with new term name, try to find by old term name and update it
        if (!termHistory) {
            termHistory = await TermHistory.findOne({
                academicYear: newAcademicYear,
                term: oldTerm
            });
            
            if (termHistory) {
                // Update the term name in term history
                termHistory.term = term;
            }
        }

        if (termHistory) {
            // Deactivate all other term histories
            await TermHistory.updateMany(
                { _id: { $ne: termHistory._id } },
                { isActive: false }
            );

            // Activate the matching term history
            termHistory.isActive = true;
            if (req.user) {
                termHistory.updatedBy = req.user.id;
            }
            await termHistory.save();
        }
    }

    res.status(200).json({
        status: "success",
        data: setting
    });
});


exports.getSetting = catchAsync(async (req, res, next) => {
    const setting = await Setting.findOne();

    if(!setting) {
        return next(new AppError("No setting found", 404));
    }

    res.status(200).json({
        status: "success",
        data: setting
    });
});

// Get current settings (for teachers/students - no permission check needed)
exports.getCurrentSettings = catchAsync(async (req, res, next) => {
    const Settings = require('../../models/Admin/Settings');
    const setting = await Settings.findOne().populate('academicYear', 'academicYear terms');

    if(!setting) {
        return next(new AppError("No setting found", 404));
    }

    res.status(200).json({
        status: "success",
        data: {
            academicYear: setting.academicYear,
            term: setting.term
        }
    });
});

// Get school timings for specific grade and gender
exports.getSchoolTimings = catchAsync(async (req, res, next) => {
    const { gradeId, gender } = req.query;
    
    const setting = await Setting.findOne();
    
    if(!setting) {
        return next(new AppError("No setting found", 404));
    }

    let timings = setting.schoolTimings.default;

    // Check for grade and gender specific override (highest priority)
    if (gradeId && gender) {
        const gradeGenderOverride = setting.schoolTimings.gradeGenderOverrides.find(
            override => override.grade.toString() === gradeId && override.gender === gender
        );
        if (gradeGenderOverride) {
            timings = { ...timings, ...gradeGenderOverride };
        }
    }

    // Check for grade specific override
    if (gradeId && !timings.startTime) {
        const gradeOverride = setting.schoolTimings.gradeOverrides.find(
            override => override.grade.toString() === gradeId
        );
        if (gradeOverride) {
            timings = { ...timings, ...gradeOverride };
        }
    }

    // Check for gender specific override
    if (gender && !timings.startTime) {
        const genderOverride = setting.schoolTimings.genderOverrides.find(
            override => override.gender === gender
        );
        if (genderOverride) {
            timings = { ...timings, ...genderOverride };
        }
    }

    res.status(200).json({
        status: "success",
        data: timings
    });
});

// Update only library settings
exports.updateLibrarySettings = catchAsync(async (req, res, next) => {
    const { librarySettings } = req.body;

    const setting = await Setting.findById(req.params.id);

    if(!setting) {
        return next(new AppError("No setting found with this ID", 404));
    }

    if (librarySettings) {
        setting.librarySettings = librarySettings;
    }

    await setting.save();

    res.status(200).json({
        status: "success",
        data: setting
    });
});

// Update only school timings
exports.updateSchoolTimings = catchAsync(async (req, res, next) => {
    const { schoolTimings } = req.body;

    const setting = await Setting.findById(req.params.id);

    if(!setting) {
        return next(new AppError("No setting found with this ID", 404));
    }

    if (schoolTimings) {
        setting.schoolTimings = schoolTimings;
    }

    await setting.save();

    res.status(200).json({
        status: "success",
        data: setting
    });
});