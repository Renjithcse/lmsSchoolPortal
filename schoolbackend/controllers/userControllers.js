// const Booking = require("../models/bookingModel");
// const Review = require("../models/reviewModel");
// const Feedback = require("../models/feedbackModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { removeCookies } = require("../utils/tokensAndCookies");
const factory = require("./handleFactory");
const {
	createAndSendVerificationCode,
	verifyCode,
} = require("./helperFunctions");
const Teacher = require("../models/users/Teacher");
const Student = require("../models/users/Student");
const AcademicStudent = require("../models/users/AcademicStudent");

//* Helping Middlewares ********************************************

// add user id in params
exports.getUserId = (req, res, next) => {
	req.params.id = req.user._id;
	next();
};

// add photo to req.body
exports.addPhotoToBody = (req, res, next) => {
	// Create an error if user tries to change password in this route
	if (req.body.password || req.body.passwordConfirm) {
		return next(
			new AppError(
				"This route is not for password updates. Please use /update-my-password",
				400
			)
		);
	}

	if (req.photo) req.body.photo = req.photo;
	next();
};

// remove Cookies
exports.removeCookiesOfUser = (req, res, next) => {
	removeCookies(res);
	next();
};

// delete all data of a deleted user
// exports.deleteAllData = catchAsync(async (req, res, next) => {
// 	await Booking.deleteMany({ user: req.params.id });
// 	await Review.deleteMany({ user: req.params.id });
// 	await Feedback.deleteMany({ user: req.params.id });
// 	next();
// });

//* Controllers ****************************************************
//* send verification code to email or phone ***********************

exports.sendVerificationCode = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.user._id);
	if (!user) {
		return next(new AppError("User not found!", 404));
	}

	await createAndSendVerificationCode(res, next, user, "code", req.body.medium);
});

//* Verify email or phone ******************************************

exports.verifyEmailOrPhone = catchAsync(async (req, res, next) => {
	const { code, medium } = req.body;
	const user = await verifyCode(code, next);

	if (medium === "email") user.emailVerified = true;
	if (medium === "phone") user.phoneVerified = true;
	await user.save({ validateBeforeSave: false });

	res.status(200).json({ status: "SUCCESS", userId: user._id });
});

//* Update My Password *********************************************

exports.updateMyPassword = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.user._id);

	// Verify old password
	if (!(await user.comparePassword(req.body.currentPassword, user.password))) {
		return next(new AppError("Your current password is wrong.", 401));
	}

	// Update new password
	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	await user.save();

	res.status(200).json({ status: "SUCCESS" });
});

//* Deactivate Me **************************************************

exports.deactivateMe = catchAsync(async (req, res, next) => {
	// change active field to false, but don't delete from DB
	await User.findByIdAndUpdate(req.user._id, {
		active: false,
		refreshTokens: [],
	});
	removeCookies(res);

	res.status(204).json({
		status: "SUCCESS",
		data: null,
	});
});

//* get guides *****************************************************

exports.getGuides = catchAsync(async (req, res, next) => {
	const guides = await User.find({ role: { $in: ["guide", "lead-guide"] } });
	res.status(200).json({ status: "SUCCESS", data: { guides } });
});

//* Using Factory Handler ******************************************

exports.getAllUsers = factory.getAll(User);
// exports.getUserById = factory.getById(User);
exports.getUserById = catchAsync(async (req, res, next) => {
	let user = await User.findById(req.params.id);
	if (!user) {
		return next(new AppError("User not found!", 404));
	}


	if (user?.role === "admin") {
		res.status(200).json({ status: "SUCCESS", data: {user} });
	}
	else if (user?.role === "student") {
		const student = await Student.findOne({ userId: user._id }).populate("role");
		if(student){
			user.student = student;
		}

		res.status(200).json({ status: "SUCCESS", data: { student } });
	}
	else {
		console.log({user})
		let teacher = await Teacher.findOne({ userId: user._id }).populate("role");


		if (teacher) {
			user.teacher = teacher;
		}

		res.status(200).json({ status: "SUCCESS", data: { teacher } });

	}

	//res.status(200).json({ status: "SUCCESS", data: { user } });
});
exports.updateUserById = factory.updateById(User, [
	"name",
	"email",
	"phone",
	"photo",
]);
exports.deleteUserById = factory.deleteById(User);

exports.getAllUsersByRole = catchAsync(async (req, res, next) => {

	console.log("inside getAllUsersByRole");
    const { role } = req.query;
    let users = [];

    if (role === "student") {
        users = await Student.find({}, { _id: 1, studentName: 1, Email: 1 });
        users = users.map(u => ({
            _id: u._id,
            name: u.studentName,
            email: u.Email
        }));
    } else if (role === "teacher") {
        users = await Teacher.find({}, { _id: 1, employeeName: 1, email: 1 });
        users = users.map(u => ({
            _id: u._id,
            name: u.employeeName,
            email: u.email
        }));
    } else {
        return next(new AppError("Invalid role. Use 'student' or 'teacher'.", 400));
    }

    res.status(200).json({
        status: "success",
        data: users
    });
});

//* New User Details Controllers ***********************************

// Get comprehensive user details including academic history
exports.getUserDetails = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const user = await User.findById(id);
	
	if (!user) {
		return next(new AppError("User not found!", 404));
	}

	let userDetails = {
		user: {
			_id: user._id,
			name: user.name,
			email: user.email,
			phone: user.phone,
			photo: user.photo,
			role: user.role,
			emailVerified: user.emailVerified,
			phoneVerified: user.phoneVerified,
		active: user.active,
		twoFactorEnabled: Boolean(user.twoFactorEnabled),
			createdAt: user.createdAt
		}
	};

	if (user.role === "student") {
		// Get student details with all populated fields
		const student = await Student.findOne({ userId: user._id })
			.populate('grade', 'gradeName')
			.populate('section', 'sectionName')
			.populate('academicYear', 'academicYear')
			.populate('Religion', 'religionName')
			.populate('Nationality', 'nationality')
			.populate('role', 'roleName');

		if (student) {
			userDetails.student = student;
			
			// Get academic history
			const academicHistory = await AcademicStudent.find({ studentId: student._id })
				.populate('grade', 'gradeName')
				.populate('section', 'sectionName')
				.populate('academicYear', 'academicYear')
				.sort({ startDate: -1 });

			userDetails.academicHistory = academicHistory;
		}
	} else if (user.role === "teacher") {
		// Get teacher details with all populated fields
		const teacher = await Teacher.findOne({ userId: user._id })
			.populate('Religion', 'religionName')
			.populate('nationality', 'nationality')
			.populate('role', 'roleName');

		if (teacher) {
			userDetails.teacher = teacher;
		}
	}

	res.status(200).json({
		status: "SUCCESS",
		data: userDetails
	});
});

// Get user profile for current logged-in user
exports.getMyProfile = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.user._id);
	
	if (!user) {
		return next(new AppError("User not found!", 404));
	}

	let profileDetails = {
		user: {
			_id: user._id,
			name: user.name,
			email: user.email,
			phone: user.phone,
			photo: user.photo,
			role: user.role,
			emailVerified: user.emailVerified,
			phoneVerified: user.phoneVerified,
		active: user.active,
		twoFactorEnabled: Boolean(user.twoFactorEnabled),
			createdAt: user.createdAt
		}
	};

	if (user.role === "student") {
		const student = await Student.findOne({ userId: user._id })
			.populate('grade', 'gradeName')
			.populate('section', 'sectionName')
			.populate('academicYear', 'academicYear')
			.populate('Religion', 'religionName')
			.populate('Nationality', 'nationality')
			.populate('role', 'roleName');

		if (student) {
			profileDetails.student = student;
			
			// Get current academic status
			const currentAcademic = await AcademicStudent.findOne({ 
				studentId: student._id,
				status: 'active'
			})
			.populate('grade', 'gradeName')
			.populate('section', 'sectionName')
			.populate('academicYear', 'academicYear');

			profileDetails.currentAcademic = currentAcademic;
		}
	} else if (user.role === "teacher") {
		const teacher = await Teacher.findOne({ userId: user._id })
			.populate('Religion', 'religionName')
			.populate('nationality', 'nationality')
			.populate('role', 'roleName');

		if (teacher) {
			profileDetails.teacher = teacher;
		}
	}

	res.status(200).json({
		status: "SUCCESS",
		data: profileDetails
	});
});

// Update user profile
exports.updateMyProfile = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.user._id);
	
	if (!user) {
		return next(new AppError("User not found!", 404));
	}

	// Update user basic info
	const allowedFields = ['name', 'email', 'phone', 'photo'];
	allowedFields.forEach(field => {
		if (req.body[field] !== undefined) {
			user[field] = req.body[field];
		}
	});

	await user.save();

	// Update role-specific details
	if (user.role === "student") {
		const student = await Student.findOne({ userId: user._id });
		if (student) {
			const studentAllowedFields = [
				'studentName', 'Dob', 'Father_name', 'Mother_name', 'contactNo',
				'Communication_no', 'Email', 'Place_of_birth', 'Communication_Address',
				'Permanent_Address', 'Zip', 'Previous_School', 'Hobbies', 'Health_Issue',
				'Passport_No', 'Passport_Expiry', 'Iqama_No', 'Iqama_Expiry',
				'Transport_Pickup', 'Pickup_BusNo', 'Transport_Drop', 'Drop_BusNo'
			];

			studentAllowedFields.forEach(field => {
				if (req.body[field] !== undefined) {
					student[field] = req.body[field];
				}
			});

			await student.save();
		}
	} else if (user.role === "teacher") {
		const teacher = await Teacher.findOne({ userId: user._id });
		if (teacher) {
			const teacherAllowedFields = [
				'employeeName', 'contactNo', 'email', 'designation', 'qualification',
				'alternativeNumber', 'dob', 'gender', 'place', 'zip',
				'communicationAddress', 'permanentAddress', 'passportNo', 'passportExpiry',
				'iqamaNo', 'iqamaExpiry', 'experienceInYears'
			];

			teacherAllowedFields.forEach(field => {
				if (req.body[field] !== undefined) {
					teacher[field] = req.body[field];
				}
			});

			await teacher.save();
		}
	}

	res.status(200).json({
		status: "SUCCESS",
		message: "Profile updated successfully"
	});
});

// Get academic history for a student
exports.getStudentAcademicHistory = catchAsync(async (req, res, next) => {
	const { studentId } = req.params;
	
	const academicHistory = await AcademicStudent.find({ studentId })
		.populate('grade', 'gradeName')
		.populate('section', 'sectionName')
		.populate('academicYear', 'academicYear')
		.sort({ startDate: -1 });

	res.status(200).json({
		status: "SUCCESS",
		data: academicHistory
	});
});

// Get user statistics
exports.getUserStats = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const user = await User.findById(id);
	
	if (!user) {
		return next(new AppError("User not found!", 404));
	}

	let stats = {
		userType: user.role,
		accountStatus: user.active ? 'Active' : 'Inactive',
		verificationStatus: {
			email: user.emailVerified,
			phone: user.phoneVerified
		},
		accountCreated: user.createdAt
	};

	if (user.role === "student") {
		const student = await Student.findOne({ userId: user._id });
		if (student) {
			const academicHistory = await AcademicStudent.find({ studentId: student._id });
			
			stats.studentInfo = {
				currentGrade: student.grade,
				currentSection: student.section,
				academicYear: student.academicYear,
				admissionDate: student.Admission_date,
				academicHistoryCount: academicHistory.length,
				activeAcademicYears: academicHistory.filter(ah => ah.status === 'active').length,
				completedAcademicYears: academicHistory.filter(ah => ah.status === 'completed').length
			};
		}
	} else if (user.role === "teacher") {
		const teacher = await Teacher.findOne({ userId: user._id });
		if (teacher) {
			stats.teacherInfo = {
				employeeId: teacher.employeeId,
				designation: teacher.designation,
				qualification: teacher.qualification,
				experienceInYears: teacher.experienceInYears,
				dateOfJoining: teacher.dateOfJoining,
				status: teacher.status
			};
		}
	}

	res.status(200).json({
		status: "SUCCESS",
		data: stats
	});
});

//* Token-based ID extraction controllers ***************************

// Get student ID from user ID
exports.getStudentIdByUserId = catchAsync(async (req, res, next) => {
	const { userId } = req.params;
	
	const student = await Student.findOne({ userId })
		.select('_id studentName studentID grade section academicYear');
	
	if (!student) {
		return next(new AppError("Student not found for this user!", 404));
	}

	res.status(200).json({
		status: "SUCCESS",
		data: {
			studentId: student._id,
			studentName: student.studentName,
			studentID: student.studentID,
			grade: student.grade,
			section: student.section,
			academicYear: student.academicYear
		}
	});
});

// Get teacher ID from user ID
exports.getTeacherIdByUserId = catchAsync(async (req, res, next) => {
	const { userId } = req.params;
	
	const teacher = await Teacher.findOne({ userId })
		.select('_id employeeName employeeId designation qualification');
	
	if (!teacher) {
		return next(new AppError("Teacher not found for this user!", 404));
	}

	res.status(200).json({
		status: "SUCCESS",
		data: {
			teacherId: teacher._id,
			employeeName: teacher.employeeName,
			employeeId: teacher.employeeId,
			designation: teacher.designation,
			qualification: teacher.qualification
		}
	});
});

// Get current user's role-specific ID
exports.getMyRoleId = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.user._id);
	
	if (!user) {
		return next(new AppError("User not found!", 404));
	}

	let roleData = {
		userId: user._id,
		role: user.role
	};

	if (user.role === "student") {
		const student = await Student.findOne({ userId: user._id })
			.select('_id studentName studentID grade section academicYear');
		
		if (student) {
			roleData.studentId = student._id;
			roleData.studentName = student.studentName;
			roleData.studentID = student.studentID;
			roleData.grade = student.grade;
			roleData.section = student.section;
			roleData.academicYear = student.academicYear;
		}
	} else if (user.role === "teacher") {
		const teacher = await Teacher.findOne({ userId: user._id })
			.select('_id employeeName employeeId designation qualification');
		
		if (teacher) {
			roleData.teacherId = teacher._id;
			roleData.employeeName = teacher.employeeName;
			roleData.employeeId = teacher.employeeId;
			roleData.designation = teacher.designation;
			roleData.qualification = teacher.qualification;
		}
	}

	res.status(200).json({
		status: "SUCCESS",
		data: roleData
	});
});
