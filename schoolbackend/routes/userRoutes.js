const express = require("express");
const userControllers = require("../controllers/userControllers");
const authMiddlewares = require("../middlewares/authMiddlewares");
const uploadMiddlewares = require("../middlewares/uploadMiddlewares");

const router = express.Router();

//* Authentication Middleware ****************************************

router.use(authMiddlewares.protect);

//* Routes *********************************************************

router
	.route("/update-my-password")
	.patch(
		authMiddlewares.providerLocal,
		userControllers.updateMyPassword
	);
router
	.route("/me")
	.get(userControllers.getUserId, userControllers.getUserById)
	.patch(
		authMiddlewares.providerLocal,
		userControllers.getUserId,
		uploadMiddlewares.uploadUserPhoto,
		uploadMiddlewares.resizeUserPhoto,
		userControllers.addPhotoToBody,
		userControllers.updateUserById
	)
// .delete(
//   userControllers.getUserId,
//   userControllers.removeCookiesOfUser,
//   userControllers.deleteAllData,
//   userControllers.deleteUserById
// );
router.patch("/deactivate", userControllers.deactivateMe);

//* Verification Routes *********************************************

router.post("/send-verification-code", userControllers.sendVerificationCode);
router.post("/verify-email-or-phone", userControllers.verifyEmailOrPhone);

//* New User Details Routes ****************************************

// Get comprehensive user details
router.get("/details/:id", userControllers.getUserDetails);

// Get my profile (current user)
router.get("/profile", userControllers.getMyProfile);

// Update my profile
router.patch("/profile",
	authMiddlewares.providerLocal,
	uploadMiddlewares.uploadUserPhoto,
	uploadMiddlewares.resizeUserPhoto,
	userControllers.addPhotoToBody,
	userControllers.updateMyProfile
);

// Get student academic history
router.get("/student/:studentId/academic-history", userControllers.getStudentAcademicHistory);

// Get user statistics
router.get("/stats/:id", userControllers.getUserStats);

//* Token-based ID extraction routes *******************************

// Get student ID from user ID
router.get("/student-id/:userId", userControllers.getStudentIdByUserId);

// Get teacher ID from user ID
router.get("/teacher-id/:userId", userControllers.getTeacherIdByUserId);

// Get current user's role-specific ID
router.get("/my-role-id", userControllers.getMyRoleId);

//* Admin Routes ***************************************************

router.get("/all", userControllers.getAllUsersByRole);
router
	.route("/:id")
	.get(userControllers.getUserById)
	.patch(
		authMiddlewares.providerLocal,
		uploadMiddlewares.uploadUserPhoto,
		uploadMiddlewares.resizeUserPhoto,
		userControllers.addPhotoToBody,
		userControllers.updateUserById
	)
//.delete(userControllers.deleteAllData, userControllers.deleteUserById);

module.exports = router;
