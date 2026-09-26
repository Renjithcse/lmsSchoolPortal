const Roles = require('../../models/Admin/Roles');
const catchAsync = require('../../utils/catchAsync');
const User = require('../../models/userModel');
const Student = require('../../models/users/Student');
const Teacher = require('../../models/users/Teacher');

// Create a new academic year with terms
exports.createRole = catchAsync(async (req, res) => {
	const role = new Roles(req.body);
	await role.save();
	res.status(201).json({
        status:'success',
        data: role
    });
});

// Get all roles
exports.getRoles = catchAsync(async (req, res) => {
	const roles = await Roles.find();
	res.status(200).json({
        status:'success',
        results: roles.length,
        data: roles
    });
});

// Get a single academic year by ID
exports.getRoleById = catchAsync(async (req, res) => {
	const roles = await Roles.findOne({ slug: req.params.id });
	if (!roles) {
		return res.status(404).json({ message: 'Role record not found' });
	}
	res.status(200).json(roles);
});

// Update an academic year by ID
exports.updateRole = catchAsync(async (req, res) => {
	const role = await Roles.findByIdAndUpdate(req.params.id, req.body, { new: true });
	if (!role) {
		return res.status(404).json({ message: 'Role record not found' });
	}
	res.status(200).json(role);
});

// Delete a role by ID
exports.deleteRole = catchAsync(async (req, res) => {
	const roleId = req.params.id;

	// First, check if the role exists
	const role = await Roles.findById(roleId);
	if (!role) {
		return res.status(404).json({ message: 'Role record not found' });
	}

	// Check if the role is being used in User model
	const users = await User.find({ role: roleId });
	if (users.length > 0) {
		return res.status(400).json({ 
			message: `Cannot delete role. This role is being used by ${users.length} user(s). Please update the user records first.` 
		});
	}

	// Check if the role is being used in Student model
	const students = await Student.find({ role: roleId });
	if (students.length > 0) {
		return res.status(400).json({ 
			message: `Cannot delete role. This role is being used by ${students.length} student(s). Please update the student records first.` 
		});
	}

	// Check if the role is being used in Teacher model
	const teachers = await Teacher.find({ role: roleId });
	if (teachers.length > 0) {
		return res.status(400).json({ 
			message: `Cannot delete role. This role is being used by ${teachers.length} teacher(s). Please update the teacher records first.` 
		});
	}

	// If no dependencies exist, proceed with deletion
	await Roles.findByIdAndDelete(roleId);
	res.status(200).json({ message: 'Role record deleted successfully' });
});
