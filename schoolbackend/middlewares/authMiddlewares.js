const jwt = require("jsonwebtoken");

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../models/userModel");
const Teacher = require("../models/users/Teacher");
const Student = require("../models/users/Student");
const { AbilityBuilder, Ability } = require('@casl/ability');
const { extractUserFromToken, extractUserIdFromToken } = require("../utils/tokensAndCookies");

//* Middlewares ****************************************************
//* Protected route ************************************************

const defineAbilitiesFor = (permissions) => {
  const { can, cannot, build } = new AbilityBuilder(Ability);

  permissions.forEach(({ action, subject, conditions }) => {
    if (conditions) {
      can(action, subject, conditions); // Conditional permissions
    } else {
      can(action, subject); // General permissions
    }
  });

  return build();
};

//* Extract user from token middleware ******************************

exports.extractUserFromToken = catchAsync(async (req, res, next) => {
  // Get token from headers or cookies
  let accessToken;
  if (req.headers.authorization?.startsWith("Bearer")) {
    accessToken = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.access) {
    accessToken = req.cookies.access;
  }

  if (accessToken) {
    const userInfo = extractUserFromToken(accessToken);
    if (userInfo) {
      req.tokenUser = userInfo;
    }
  }

  next();
});

//* Get current user ID from token ********************************

exports.getCurrentUserId = catchAsync(async (req, res, next) => {
  let accessToken;
  if (req.headers.authorization?.startsWith("Bearer")) {
    accessToken = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.access) {
    accessToken = req.cookies.access;
  }

  if (accessToken) {
    const userId = extractUserIdFromToken(accessToken);
    if (userId) {
      req.currentUserId = userId;
    }
  }

  next();
});

//* Get student ID from token **************************************

exports.getStudentIdFromToken = catchAsync(async (req, res, next) => {
  let accessToken;
  if (req.headers.authorization?.startsWith("Bearer")) {
    accessToken = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.access) {
    accessToken = req.cookies.access;
  }

  if (accessToken) {
    const userInfo = extractUserFromToken(accessToken);
    if (userInfo && userInfo.role === "student") {
      // Find the student record for this user
      const student = await Student.findOne({ userId: userInfo.id });
      if (student) {
        req.studentId = student._id;
        req.currentUserId = userInfo.id;
      }
    }
  }

  next();
});

//* Get teacher ID from token **************************************

exports.getTeacherIdFromToken = catchAsync(async (req, res, next) => {
  let accessToken;
  if (req.headers.authorization?.startsWith("Bearer")) {
    accessToken = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.access) {
    accessToken = req.cookies.access;
  }

  if (accessToken) {
    const userInfo = extractUserFromToken(accessToken);
    if (userInfo && userInfo.role === "teacher") {
      // Find the teacher record for this user
      const teacher = await Teacher.findOne({ userId: userInfo.id });
      if (teacher) {
        req.teacherId = teacher._id;
        req.currentUserId = userInfo.id;
      }
    }
  }

  next();
});

exports.protect = catchAsync(async (req, res, next) => {
  req.isProtectedRoute = true;
  // Get token and check its existance
  let accessToken;
  if (req.headers.authorization?.startsWith("Bearer")) {
    accessToken = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.access) {
    accessToken = req.cookies.access;
  }

  if (!accessToken) {
    return next(new AppError("Please login to proceed!", 401));
  }

  // Verify token
  let decodedToken;
  try {
    decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Please login to proceed!", 401));
    }
    return next(new AppError("Invalid Token!", 401));
  }

  // Check if user still exists
  const user = await User.findById(decodedToken?.id).select(
    "+passwordChangedAt"
  );
  if (!user) {
    return next(new AppError("User not found!", 401));
  }

  // Check if user changed password after accessToken was issued
  if (user.changedPasswordAfter(decodedToken.iat)) {
    return next(
      new AppError("User recently changed password. Please login again!", 401)
    );
  }

  // Grant access to protected route
  req.user = user;
  
  // Add token user info for easy access
  req.tokenUser = {
    id: user._id,
    email: user.email,
    role: user.role,
    name: user.name,
    phone: user.phone,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    active: user.active
  };

  if(user?.role === "admin"){
    req.ability = defineAbilitiesFor([
      { action: "manage", subject: "all" },
    ]);
  }
  else if(user?.role === "student"){
    const student = await Student.findOne({ userId: user._id }).populate("role");
    if(student){
      req.studentId = student._id;
      req.ability = defineAbilitiesFor(student?.role?.permissions || []);
    }
  }
  else if(user?.role === "user"){
    const teacher = await Teacher.findOne({ userId: user._id }).populate("role");
    console.log({teacher})
    if(teacher){
      req.teacherId = teacher._id;
      req.ability = defineAbilitiesFor(teacher?.role?.permissions || []);
    }
  }
  next();
});

//* Restricted route ***********************************************

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You don't have permission to perform this action!", 403)
      );
    }

    next();
  };

//* User Verification Check ****************************************

exports.verified = (req, res, next) => {
  if (!req.user.emailVerified) {
    return next(
      new AppError("Please verify your email to perform this action!", 403)
    );
  }

  next();
};

//* Local provider check *******************************************

exports.providerLocal = (req, res, next) => {
  const { provider } = req.user;
  if (provider !== "local") {
    return next(
      new AppError(`Please use ${provider} to perform the following operation!`)
    );
  }
  next();
};
