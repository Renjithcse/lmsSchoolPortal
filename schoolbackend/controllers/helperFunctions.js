const crypto = require("crypto");

const User = require("../models/userModel");
// const Booking = require("../models/bookingModel");
const AppError = require("../utils/appError");
const Email = require("../utils/email");
// const sendSMS = require("../utils/mobileSMS");
const { createTokensAndCookies } = require("../utils/tokensAndCookies");
const Teacher = require("../models/users/Teacher");
const Student = require("../models/users/Student");

//* Create and send tokens *****************************************

exports.sendTokensAndCookies = async (
	req,
	res,
	user,
	statusCode,
	redirectUrl,
	extraPayload = {}
) => {
	if (req.cookies?.refresh) {
		// If any cookie => remove it from DB
		user.refreshTokens = user.refreshTokens.filter(
			(rt) => rt.token !== req.cookies.refresh
		);

		// Reuse detection
		const foundToken = await User.findOne({
			"refreshTokens.token": req.cookies.refresh,
		});
		if (!foundToken) user.refreshTokens = [];
	}

	const accessToken = await createTokensAndCookies(user, res);

	if (user.provider === "local") {
		const responseUser = {
			id: user._id,
			name: user.name,
			email: user.email,
			phone: user.phone,
			photo: user.photo,
			role: { roleName: user.role },
			twoFactorEnabled: Boolean(user.twoFactorEnabled),
			emailVerified: Boolean(user.emailVerified),
		};

		if (user.role === "student") {
			const student = await Student.findOne({ userId: user._id }).populate("role");
			if (student) {
				responseUser.student = student;
			}
		} else if (user.role === "user") {
			const teacher = await Teacher.findOne({ userId: user._id }).populate("role");
			if (teacher) {
				responseUser.teacher = teacher;
			}
		}

		res.status(statusCode).json({
			status: "SUCCESS",
			accessToken,
			user: responseUser,
			...extraPayload,
		});
	} else {
		res.redirect(`${process.env.FRONTEND_URL}${redirectUrl}?status=success`);
	}
};

//* Delete expired refresh tokens **********************************

exports.deleteExpiredTokens = async (user) => {
	user.refreshTokens = user.refreshTokens.filter(
		(rt) => rt?.expiresIn?.getTime() > Date.now()
	);
};

//* create and send verification code ******************************

exports.createAndSendVerificationCode = async (
	res,
	next,
	user,
	type,
	medium
) => {
	const resetCode = user.createVerificationCode(type);

	try {
		// send token to user's mail/phone
		if (medium === "email" && type === "link") {
			const resetURL = `${process.env.FRONTEND_URL}/auth/passwordReset/${resetCode}`;
			await new Email(user, resetURL).sendPasswordReset();
		} else if (medium === "email" && type === "code") {
			await new Email(user, resetCode).sendVerificationCode();
		} else if (medium === "phone" && type === "code") {
			// await sendSMS(resetCode, user.phone);
		} else {
			throw new AppError(
				"Please choose a valid way - email(link/code) or phone(code) only!",
				400
			);
		}

		await user.save({ validateBeforeSave: false });
		res
			.status(200)
			.json({ status: "SUCCESS", message: `Code sent to your ${medium}!` });
	} catch (error) {
		console.error("Email sending error:", error);
		console.error("Error details:", {
			userId: user._id,
			userEmail: user.email,
			userName: user.name,
			medium: medium,
			type: type,
			errorMessage: error.message,
			errorStack: error.stack
		});

		user.verificationCode = undefined;
		user.verificationCodeExpires = undefined;
		await user.save({ validateBeforeSave: false });
		next(
			new AppError(
				`Error sending verification code to your ${medium}. Try again later!`,
				500
			)
		);
	}
};

// Create and send a new verification code for newly registered users

exports.createAndSendVerificationCodeNewUser = async (
	res,
	next,
	teacher,
	type,
	medium
) => {
	const resetCode = teacher.createVerificationCodeTeacher(type);

	let user = {
        name: teacher.employeeName || "User",
        email: teacher.email,
        phone: teacher.contactNo,
	}

	try {
		// send token to user's mail/phone
		if (medium === "email" && type === "link") {
			const resetURL = `${process.env.FRONTEND_URL}/auth/passwordReset/${resetCode}`;
			await new Email(user, resetURL).sendPasswordReset();
		} else if (medium === "email" && type === "code") {
			await new Email(user, resetCode).sendVerificationCode();
		} else if (medium === "phone" && type === "code") {
			// await sendSMS(resetCode, user.phone);
		} else {
			throw new AppError(
				"Please choose a valid way - email(link/code) or phone(code) only!",
				400
			);
		}

		await teacher.save({ validateBeforeSave: false });
		res
			.status(200)
			.json({ status: "SUCCESS", message: `Code sent to your ${medium}!` });
	} catch (error) {
		console.error("Email sending error:", error);
		console.error("Error details:", {
			teacherId: teacher._id,
			teacherEmail: teacher.email,
			teacherName: teacher.employeeName,
			medium: medium,
			type: type,
			errorMessage: error.message,
			errorStack: error.stack
		});

		teacher.verificationCode = undefined;
		teacher.verificationCodeExpires = undefined;
		await teacher.save({ validateBeforeSave: false });
		next(
			new AppError(
				`Error sending verification code to your ${medium}. Try again later!`,
				500
			)
		);
	}
};


//* Verify code ****************************************************

exports.verifyCode = async (code, next) => {
	const hashedCode = crypto.createHash("sha256").update(code).digest("hex");
	const user = await User.findOne({
		verificationCode: hashedCode,
		verificationCodeExpires: { $gt: Date.now() },
	});
	if (!user) {
		return next(new AppError("Invalid Code or code has expired.", 400));
	}

	return user;
};

//* Verify code for teacher ******************************************

exports.verifyCodeTeacher = async (code, next) => {
    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");
    const teacher = await Teacher.findOne({
        verificationCode: hashedCode,
        verificationCodeExpires: { $gt: Date.now() },
    });
    if (!teacher) {
        return next(new AppError("Invalid Code or code has expired.", 400));
    }

    return teacher;
};

//* change password ************************************************

exports.changePassword = async (req, res, user) => {
	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	user.verificationCode = undefined;
	user.verificationCodeExpires = undefined;
	user.verificationCodeChecked = undefined;
	await user.save();

	res.status(200).json({ status: "SUCCESS" });
};

//* filter req.body ************************************************

exports.filterObj = (obj, allowedFields) => {
	const newObj = {};
	Object.keys(obj).forEach((el) => {
		if (allowedFields.includes(el)) newObj[el] = obj[el];
	});

	return newObj;
};

//* create booking checkout ****************************************


