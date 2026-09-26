const { authenticator } = require("otplib");
const QRCode = require("qrcode");

const User = require("../../models/userModel");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const {
  sendTokensAndCookies,
  verifyCode,
  createAndSendVerificationCode,
} = require("../helperFunctions");

//* Enable 2FA  ****************************************************

exports.enable2FA = catchAsync(async (req, res, next) => {
  const userId = req.user?._id || req.body?.userId;
  if (!userId) {
    return next(new AppError("Unauthorized", 401));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("No user found", 404));
  }

  if (!["admin", "user"].includes(user.role)) {
    return next(new AppError("Two-factor authentication is available only for staff accounts.", 403));
  }

  if (!user.emailVerified) {
    return next(new AppError("Verify your email before enabling two-factor authentication.", 403));
  }

  if (user.twoFactorEnabled) {
    return next(new AppError("Two-factor authentication is already enabled. Disable it before setting up a new authenticator.", 400));
  }

  const secret = authenticator.generateSecret();
  user.twoFactorSecret = secret;
  await user.save({ validateBeforeSave: false });

  const serviceName = process.env.OTP_APP_NAME || "School Portal";
  const accountName = user.email || `${user.phone}`;
  const otpauthUrl = authenticator.keyuri(accountName, serviceName, secret);
  const qrCode = await QRCode.toDataURL(otpauthUrl);

  res
    .status(200)
    .json({
      status: "SUCCESS",
      data: {
        secret,
        qrCode,
        otpauthUrl,
        serviceName,
        accountName,
      },
    });
});

//* Verify 2FA  ****************************************************

exports.verify2FA = catchAsync(async (req, res, next) => {
  const userId = req.user?._id || req.body?.userId;
  if (!userId) {
    return next(new AppError("Unauthorized", 401));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("User not found!", 404));
  }

  if (!["admin", "user"].includes(user.role)) {
    return next(new AppError("Two-factor authentication is available only for staff accounts.", 403));
  }

  if (!user.emailVerified) {
    return next(new AppError("Verify your email before enabling two-factor authentication.", 403));
  }

  if (!user.twoFactorSecret) {
    return next(new AppError("Two-factor authentication has not been initiated.", 400));
  }

  const isValid = authenticator.verify({
    token: req.body.token,
    secret: user.twoFactorSecret,
  });
  if (!isValid) {
    return next(new AppError("Invalid token or token expired!", 400));
  }

  user.twoFactorEnabled = true;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ status: "SUCCESS" });
});

//* Validate 2FA (authenticator)  **********************************

exports.validate2FAUsingAuthenticator = catchAsync(async (req, res, next) => {
  const { userId, token } = req.body;

  const user = await User.findById(userId);
  if (!user?.passwordChecked) {
    return next(new AppError("User not found!", 401));
  }

  const isValid = authenticator.verify({
    token,
    secret: user.twoFactorSecret,
  });
  if (!isValid) {
    return next(new AppError("Invalid token or token expired!", 401));
  }

  user.passwordChecked = undefined;
  await user.save({ validateBeforeSave: false });
  sendTokensAndCookies(req, res, user, 200);
});

//* send 2FA code using email or phone *****************************

exports.send2FACodeForEmailOrPhone = catchAsync(async (req, res, next) => {
  const { userId, medium } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("User not found!", 404));
  }

  await createAndSendVerificationCode(res, next, user, "code", medium);
});

//* validate 2FA code (email/phone) ********************************

exports.validate2FACodeUsingEmailOrPhone = catchAsync(
  async (req, res, next) => {
    const user = await verifyCode(req.body.code, next);

    if (!user?.passwordChecked) {
      return next(new AppError("User not found!", 404));
    }

    user.passwordChecked = undefined;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;

    sendTokensAndCookies(req, res, user, 200);
  }
);

//* Disable 2FA  ***************************************************

exports.disable2FA = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError("User not found!", 404));
  }

  if (!["admin", "user"].includes(user.role)) {
    return next(new AppError("Two-factor authentication is available only for staff accounts.", 403));
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ status: "SUCCESS" });
});
