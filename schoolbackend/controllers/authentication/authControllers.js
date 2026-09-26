const User = require("../../models/userModel");
const Teacher = require('../../models/users/Teacher');
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const { uploadTeacherProfilePictureToS3 } = require("../../utils/teacherS3Helper");

const {
	sendTokensAndCookies,
	deleteExpiredTokens,
	verifyCode,
	changePassword,
	createAndSendVerificationCode,
	createAndSendVerificationCodeNewUser,
	verifyCodeTeacher,
} = require("../helperFunctions");
const { removeCookies } = require("../../utils/tokensAndCookies");
const Student = require("../../models/users/Student");

//* Controllers ****************************************************
//* Sign up ********************************************************

exports.signup = catchAsync(async (req, res) => {
	const { name, email, phone, password, passwordConfirm } = req.body;

	const user = await User.create({
		name,
		email,
		phone,
		password,
		passwordConfirm,
	});

	sendTokensAndCookies(req, res, user, 201);
});

//New Student Signup
exports.signupStudent = catchAsync(async (req, res) => {
    const { userName, password, confirmPassword, _id } = req.body;

    const student = await Student.findById(_id)

    if(!student){
        return next(new AppError("User not found. Please contact administrator for registration!", 409));
    }

	//Check if the username already exists
	const existingUser = await User.findOne({ email: userName });
    if (existingUser) {
        return next(new AppError("Username already exists. Please choose a different one!", 409));
    }


	const user = await User.create({
		name: student.studentName,
		email: userName,
		phone: student?.contactNo,
		password,
		passwordConfirm: confirmPassword,
		role: 'student'
	});

    await Student.findByIdAndUpdate(_id, { userId: user._id, role : "678fabda0a479539ffc2724f" })

	

	sendTokensAndCookies(req, res, user, 201);
});

//New user By Teacher Verification 
exports.teacherSignup = catchAsync(async (req, res, next) => {
	const { _id, password, confirmPassword, ...profileData } = req.body;

	const teacher = await Teacher.findById(_id)

	if(!teacher){
		return next(new AppError("Teacher not found. Please contact administrator for registration!", 409));
	}

	// Handle profile picture upload if provided
	if (profileData.profilePicture && typeof profileData.profilePicture === 'string' && profileData.profilePicture.startsWith('data:image/')) {
		try {
			const profilePictureData = await uploadTeacherProfilePictureToS3(profileData.profilePicture, 'teachers/profiles');
			profileData.profilePicture = profilePictureData.url;
		} catch (error) {
			console.error('Error uploading profile picture:', error);
			// Continue without profile picture if upload fails
			delete profileData.profilePicture;
		}
	}

	// Update teacher profile if profile data is provided
	const allowedProfileFields = [
		'profilePicture', 'designation', 'qualification', 'alternativeNumber', 'dob', 'gender',
		'Religion', 'dateOfJoining', 'experienceInYears', 'place', 'zip',
		'communicationAddress', 'permanentAddress', 'nationality', 'Province',
		'City', 'passportNo', 'passportExpiry', 'iqamaNo', 'iqamaExpiry'
	];
	
	const updateData = {};
	allowedProfileFields.forEach(field => {
		if (profileData[field] !== undefined && profileData[field] !== null && profileData[field] !== '') {
			updateData[field] = profileData[field];
		}
	});

	if (Object.keys(updateData).length > 0) {
		await Teacher.findByIdAndUpdate(_id, updateData, { runValidators: false });
	}

	const user = await User.create({
		name: teacher.employeeName,
		email: teacher.email,
		phone: teacher.contactNo,
		password,
		passwordConfirm: confirmPassword,
		role: 'user',
		emailVerified: true,
	});

	await Teacher.findByIdAndUpdate(_id, { userId: user._id, role : "678fabda0a479539ffc2724f" })

	

	sendTokensAndCookies(req, res, user, 201);
});

//New Teacher Registration By Email
exports.signupByEmail = catchAsync(async (req, res, next) => {
	const { email } = req.body;

	const teacher = await Teacher.findOne({ email })
	if (!teacher) {
		return next(new AppError("Email not registered. Please contact administrator for registration!", 409));
	}

	createAndSendVerificationCodeNewUser(res, next, teacher, "code", "email");
});

//* Log in *********************************************************

exports.login = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return next(new AppError("Please provide both email and password.", 400));
	}

	const user = await User.findOne({ email });
	if (!user || !(await user.comparePassword(password, user.password))) {
		return next(new AppError("Invalid Credentials!", 401));
	}

	

	deleteExpiredTokens(user);
	if (user.twoFactorEnabled) {
		user.passwordChecked = true;
		await user.save({ validateBeforeSave: false });
		return res.status(200).json({ status: "PENDING_2FA", userId: user._id });
	}
	sendTokensAndCookies(req, res, user, 200);
	// if(user?.role === "admin"){
	// 	sendTokensAndCookies(req, res, user, 200);
	// }
	// else if(user?.role === "user"){
	// 	let teacher = await Teacher.findOne({ userId: user._id }).populate('role');


	// 	if(teacher){
	// 		sendTokensAndCookies(req, res, user, 200);
	// 	}

		
	// }
	// else if(user?.role === "student"){
	// 	let student = await Student.findOne({ userId: user._id }).populate('role');

    //     if(student){
    //         user.student = student;

    //         sendTokensAndCookies(req, res, user, 200);
    //     }
	// }

	
});

//* Log in with google *********************************************

exports.loginWithGoogle = async (req, res) => {
	try {
		const redirectUrl = req.query.state;
		const { name, email, picture, email_verified } = req.user._json;
		const body = {
			name,
			photo: picture,
			email,
			provider: "Google",
			// eslint-disable-next-line camelcase
			emailVerified: email_verified,
			phoneVerified: undefined,
		};

		// create or update user
		let user = await User.findOne({ email });
		if (user) {
			user.set(body);
		} else {
			user = new User(body);
		}
		await user.save({ validateBeforeSave: false });

		deleteExpiredTokens(user);
		sendTokensAndCookies(req, res, user, 200, redirectUrl);
	} catch (err) {
		console.error("Error:", err);
		res.redirect(`${process.env.FRONTEND_URL}/login`);
	}
};

//* Log out ********************************************************

exports.logout = catchAsync(async (req, res) => {
	if (req.cookies?.refresh) {
		const user = await User.findOne({
			"refreshTokens.token": req.cookies.refresh,
		});
		if (user) {
			user.refreshTokens = user.refreshTokens.filter(
				(rt) => rt.token !== req.cookies.refresh
			);
			await user.save({ validateBeforeSave: false });
		}
	}

	removeCookies(res);
	res.status(200).json({ status: "SUCCESS" });
});

//* Forgot Password ************************************************

exports.forgotPassword = catchAsync(async (req, res, next) => {
	const { email, type, medium } = req.body;

	// Get user with the provided email
	const user = await User.findOne({ email });
	if (!user) {
		return next(new AppError("Please provide a valid email Id!", 404));
	}
	if (user.provider !== "local") {
		return next(new AppError(`Login using ${user.provider}!`, 400));
	}

	await createAndSendVerificationCode(res, next, user, type, medium);
});

//* Reset Password using link **************************************

exports.resetPasswordUsingLink = catchAsync(async (req, res, next) => {
	const user = await verifyCode(req.body.code, next);
	if (user) await changePassword(req, res, user);
});

//* Reset Password Code verification *******************************

exports.resetPasswordCodeVerification = catchAsync(async (req, res, next) => {
	const user = await verifyCode(req.body.code, next);

	user.verificationCodeChecked = true;
	await user.save({ validateBeforeSave: false });

	res.status(200).json({ status: "SUCCESS", userId: user._id });
});


//* Register user verification code ****************************

exports.registerTeacherVerificationCode = catchAsync(async (req, res, next) => {
    const teacher = await verifyCodeTeacher(req.body.code, next);

	teacher.verificationCodeChecked = true;
	await teacher.save({ validateBeforeSave: false });

	const user = await User.findOne({ email: teacher.email });
	if (user && !user.emailVerified) {
		user.emailVerified = true;
		await user.save({ validateBeforeSave: false });
	}

	res.status(200).json({ status: "SUCCESS", userId: teacher._id });
});

//* Reset password using code **************************************

exports.resetPasswordUsingCode = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.body.userId);
	if (
		!user?.verificationCodeChecked ||
		user?.verificationCodeExpires.getTime() < Date.now()
	) {
		return next(new AppError("Time expired or code not verified!", 400));
	}

	await changePassword(req, res, user);
});
