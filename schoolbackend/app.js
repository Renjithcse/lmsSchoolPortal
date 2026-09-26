const express = require("express");
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const passport = require("passport");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const studentUserRoutes = require("./routes/users/studentRoutes");
const teacherRoutes = require("./routes/users/teacherRoutes");
const academcRoutes = require("./routes/admin/academicRoutes");
const gradeRoutes = require("./routes/admin/gradeRoutes");
const religionRoutes = require("./routes/admin/religionRoutes");
const countryRoutes = require("./routes/admin/countryRoutes");
const stateRoutes = require("./routes/admin/stateRoutes");
const cityRoutes = require("./routes/admin/cityRoutes");
const subjectRoutes = require("./routes/admin/subjectRoutes");
const sectionRoutes = require("./routes/admin/sectionRoutes");
const gradeSubjectRoutes = require("./routes/admin/gradeSubjectRoutes");
const groupSubjectRoutes = require("./routes/admin/groupSubjectRoutes");
const StudentsSubjectsRoutes = require("./routes/admin/studentSubjectRoutes");
const RoleRoutes = require("./routes/admin/roleRoutes");
const onlineExamRoutes = require("./routes/onlineExam/onlineExamRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const markRoutes = require("./routes/SubjectMark/mark");
const settingRoutes = require("./routes/admin/settingsRoutes");
const gradePermissionRoutes = require("./routes/admin/gradePermissionRoute");
const subjectPermissionRoutes = require("./routes/admin/subjectPermissionRoute");
const termHistoryRoutes = require("./routes/admin/termHistoryRoutes");
const timetableRoutes = require("./routes/admin/timetableRoutes");
const inventoryRoutes = require("./routes/inventory/index");
const studentRoutes = require("./routes/students/index");
const studentDashboardRoutes = require("./routes/users/studentDashboardRoutes");
const libraryRoutes = require("./routes/library/index");
const blogRoutes = require("./routes/blog/index");
const attendanceRoutes = require("./routes/Attendance/index");
const adminSubjectNotesRoutes = require("./routes/admin/subjectNotesRoutes");
const studentSubjectNotesRoutes = require("./routes/users/subjectNotesRoutes");
const accountingRoutes = require("./routes/accounting/index");
const adminInformationRoutes = require("./routes/admin/informationRoutes");
const studentInformationRoutes = require("./routes/users/informationRoutes");
const adminLessonPlanRoutes = require("./routes/admin/lessonPlanRoutes");
const studentLessonPlanRoutes = require("./routes/users/lessonPlanRoutes");
const adminChapterRoutes = require("./routes/admin/chapterRoutes");
const studentClassFeedbackRoutes = require("./routes/users/studentClassFeedbackRoutes");
const studentSubjectFeedbackRoutes = require("./routes/users/studentSubjectFeedbackRoutes");
const eventGalleryRoutes = require("./routes/admin/eventGalleryRoutes");
const studentEventGalleryRoutes = require("./routes/users/eventGalleryRoutes");


const AppError = require("./utils/appError");
const errorHandler = require("./middlewares/errorMiddleware");
const sanitizeHtml = require("./middlewares/sanitizeHtml");
require("./controllers/authentication/passport");

//* Start express app **********************************************

const app = express();

// Trust first proxy (needed when behind nginx/load balancer so rate limit uses X-Forwarded-For)
app.set('trust proxy', 1);

// Increase request body size limit
app.use(express.json({ limit: "50mb" })); // Adjust limit as needed
app.use(express.urlencoded({ limit: "50mb", extended: true }));


app.use(cors({
	origin: ["http://localhost:3001", "http://localhost:3002", process.env.FRONTEND_URL, "http://localhost:8081"], // Set allowed origins
	credentials: true, // Allow cookies
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
	exposedHeaders: ['Set-Cookie']
}));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));



app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	res.header('Access-Control-Allow-Credentials', 'true');
	if (req.method === 'OPTIONS') {
	  return res.sendStatus(200); // Handle preflight requests correctly
	}
	next();
});


// set security HTTP headers
// app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// Logger for dev
if (process.env.NODE_ENV === "development") {
	app.use(morgan("dev"));
}

// Limit requests
const limiter = rateLimit({
	//TODO change max to 100
	max: 1000,
	windowMs: 60 * 60 * 1000,
	message: new AppError(
		"Too many requests from this IP, please try again in an hour",
		429
	),
});
app.use("/api", limiter);

// stripe webhook (not global middleware)
// app.post(
//   "/api/v2/booking/webhook-checkout",
//   express.raw({ type: "application/json" }),
// );



// Body parser
app.use(express.json());

// passport
app.use(passport.initialize());

// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(sanitizeHtml());

// Prevent paramater pollution
app.use(
	hpp({
		whitelist: [
			"duration",
			"ratingsAverage",
			"ratingsQuantity",
			"maxGroupSize",
			"difficulty",
			"price",
		],
	})
);

// compression
app.use(compression());

//* Routes *********************************************************

// Root route removed - frontend will be served by static files and catch-all route

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
// app.use("/api/v2/tour", tourRoutes);
// app.use("/api/v2/review", reviewRoutes);
// app.use("/api/v2/booking", bookingRoutes);

app.use("/api/v1/users/student", studentUserRoutes)
app.use("/api/v1/users/teacher", teacherRoutes)

app.use("/api/v1/admin/academic", academcRoutes)
app.use("/api/v1/admin/grade", gradeRoutes)
app.use("/api/v1/admin/religion", religionRoutes)
app.use("/api/v1/admin/country", countryRoutes)
app.use("/api/v1/admin/state", stateRoutes)
app.use("/api/v1/admin/city", cityRoutes)
app.use("/api/v1/admin/subject", subjectRoutes)
app.use("/api/v1/admin/section", sectionRoutes)
app.use("/api/v1/admin/grade_subject", gradeSubjectRoutes)
app.use("/api/v1/admin/group_subject", groupSubjectRoutes)
app.use("/api/v1/admin/subject_students", StudentsSubjectsRoutes)
app.use("/api/v1/admin/roles", RoleRoutes)
app.use("/api/v1/onlineExam", onlineExamRoutes)
app.use("/api/v1/assignment", assignmentRoutes)
app.use("/api/v1/mark", markRoutes)
app.use("/api/v1/admin/settings", settingRoutes)
app.use("/api/v1/admin/GradePermissions", gradePermissionRoutes)
app.use("/api/v1/admin/subjectpermissions", subjectPermissionRoutes)
app.use("/api/v1/admin/term-history", termHistoryRoutes)
app.use("/api/v1/admin/timetable", timetableRoutes)
app.use("/api/v1/inventory", inventoryRoutes)
app.use("/api/v1/students", studentRoutes)
app.use("/api/v1/student-dashboard", studentDashboardRoutes)
app.use("/api/v1/library", libraryRoutes)
app.use("/api/v1/blog", blogRoutes)
app.use("/api/v1/attendance", attendanceRoutes)
app.use("/api/v1/admin/subject-notes", adminSubjectNotesRoutes)
app.use("/api/v1/student/subject-notes", studentSubjectNotesRoutes)
app.use("/api/v1/admin/chapters", adminChapterRoutes)
app.use("/api/v1/admin/lesson-plans", adminLessonPlanRoutes)
app.use("/api/v1/student/lesson-plans", studentLessonPlanRoutes)
app.use("/api/v1/admin/information", adminInformationRoutes)
app.use("/api/v1/student/information", studentInformationRoutes)
app.use("/api/v1/admin/event-gallery", eventGalleryRoutes)
app.use("/api/v1/student/event-gallery", studentEventGalleryRoutes)
app.use("/api/v1/student/class-feedback", studentClassFeedbackRoutes)
app.use("/api/v1/student/subject-feedback", studentSubjectFeedbackRoutes)
app.use("/api/v1/accounting", accountingRoutes)

//* Serve CRA build (single-container deploy). Dockerfile copies the build to
//* SchoolPortalAdmin/build. API + uploads already mounted above.
const frontendBuildPath = path.join(__dirname, "SchoolPortalAdmin/build");
const frontendIndexPath = path.join(frontendBuildPath, "index.html");
if (fs.existsSync(frontendIndexPath)) {
	app.use(express.static(frontendBuildPath));
	app.get("*", (req, res, next) => {
		if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
			return next(
				new AppError(`Can't find ${req.originalUrl} route on this server!`, 404)
			);
		}
		res.sendFile(frontendIndexPath);
	});
} else {
	app.all("/api/*", (req, res, next) => {
		next(
			new AppError(`Can't find ${req.originalUrl} route on this server!`, 404)
		);
	});
}

// Global error handling
app.use(errorHandler);

module.exports = app;
