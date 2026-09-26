const Religion = require('../../models/Admin/Religion');
const catchAsync = require('../../utils/catchAsync');
const Student = require('../../models/users/Student');
const Teacher = require('../../models/users/Teacher');

// Create a new religion
exports.createReligion = catchAsync(async (req, res, next) => {
    try {
        const religion = new Religion(req.body);
        await religion.save();
        res.status(201).json(religion);
    } catch (error) {
        if (error.code === 11000) {
            // Duplicate key error
            return res.status(400).json({ message: 'Religion name must be unique' });
        }
        res.status(400).json({ message: error.message });
    }
});

// Get all religions
exports.getReligions = catchAsync(async (req, res) => {
    const religions = await Religion.find();
    res.status(200).json(religions);
});

// Get a single religion by ID
exports.getReligionById = catchAsync(async (req, res) => {
    const religion = await Religion.findById(req.params.id);
    if (!religion) {
        return res.status(404).json({ message: 'Religion not found' });
    }
    res.status(200).json(religion);
});

// Update a religion by ID
exports.updateReligion = catchAsync(async (req, res) => {
    try {
        // Check if the new religionName already exists
        const existingReligion = await Religion.findOne({ religionName: req.body.religionName });

        if (existingReligion && existingReligion._id.toString() !== req.params.id) {
            // If a different religion with the same name exists, return an error
            return res.status(400).json({ message: 'Religion name must be unique' });
        }

        // Proceed with the update if the religionName is unique
        const religion = await Religion.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!religion) {
            return res.status(404).json({ message: 'Religion not found' });
        }

        res.status(200).json(religion);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a religion by ID
exports.deleteReligion = catchAsync(async (req, res) => {
    const religionId = req.params.id;

    // First, check if the religion exists
    const religion = await Religion.findById(religionId);
    if (!religion) {
        return res.status(404).json({ message: 'Religion not found' });
    }

    // Check if the religion is being used in Student model
    const students = await Student.find({ Religion: religionId });
    if (students.length > 0) {
        return res.status(400).json({ 
            message: `Cannot delete religion. This religion is being used by ${students.length} student(s). Please update the student records first.` 
        });
    }

    // Check if the religion is being used in Teacher model
    const teachers = await Teacher.find({ Religion: religionId });
    if (teachers.length > 0) {
        return res.status(400).json({ 
            message: `Cannot delete religion. This religion is being used by ${teachers.length} teacher(s). Please update the teacher records first.` 
        });
    }

    // If no dependencies exist, proceed with deletion
    await Religion.findByIdAndDelete(religionId);
    res.status(200).json({ message: 'Religion deleted successfully' });
});
