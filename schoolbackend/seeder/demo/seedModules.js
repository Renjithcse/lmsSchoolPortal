const User = require("../../models/userModel");
const Teacher = require("../../models/users/Teacher");
const Student = require("../../models/users/Student");
const AcademicStudent = require("../../models/users/AcademicStudent");
const SectionHistory = require("../../models/users/SectionHistory");
const AcademicYear = require("../../models/Admin/AcademicYear");
const Grade = require("../../models/Admin/Grade");
const Section = require("../../models/Admin/Section");
const Subject = require("../../models/Admin/Subject");
const GradeSubject = require("../../models/Admin/GradeSubject");
const GroupSubject = require("../../models/Admin/GroupSubject");
const Religion = require("../../models/Admin/Religion");
const Roles = require("../../models/Admin/Roles");
const Settings = require("../../models/Admin/Settings");
const Timetable = require("../../models/Admin/Timetable");
const ClassTeacher = require("../../models/Admin/ClassTeacher");
const TermHistory = require("../../models/Admin/TermHistory");
const GradePermission = require("../../models/Admin/GradePermissions");
const SubjectPermission = require("../../models/Admin/SubjectPermissions");
const StudentSubject = require("../../models/Admin/StudentSubject");
const EventGallery = require("../../models/Admin/EventGallery");
const Country = require("../../models/Admin/Country");
const State = require("../../models/Admin/State");
const City = require("../../models/Admin/City");
const Attendance = require("../../models/Attendance/Attendance");
const Assignment = require("../../models/Assignments/Assignment");
const PublishAssignment = require("../../models/Assignments/Publish");
const StudentAssignmentAttempt = require("../../models/Assignments/StudentAssignment");
const Book = require("../../models/Library/Book");
const BookIssue = require("../../models/Library/BookIssue");
const BookCatalog = require("../../models/Library/BookCatalog");
const BookCategory = require("../../models/Library/Category");
const Rack = require("../../models/Library/Rack");
const Post = require("../../models/Blog/Post");
const Comment = require("../../models/Blog/Comment");
const Information = require("../../models/Information/Information");
const SubjectFeedback = require("../../models/Feedback/SubjectFeedback");
const ClassFeedback = require("../../models/Feedback/ClassFeedback");
const SubjectNotes = require("../../models/SubjectNotes/SubjectNotes");
const PublishedSubjectNotes = require("../../models/SubjectNotes/PublishedSubjectNotes");
const LessonPlan = require("../../models/LessonPlans/LessonPlan");
const Chapter = require("../../models/LessonPlans/Chapter");
const PublishedChapter = require("../../models/LessonPlans/PublishedChapter");
const LessonPlanProgress = require("../../models/LessonPlans/LessonPlanProgress");
const OnlineExam = require("../../models/OnlineExam/OnlineExam");
const Question = require("../../models/OnlineExam/Question");
const QuestionBank = require("../../models/OnlineExam/QuestionBank");
const Publish = require("../../models/OnlineExam/Publish");
const StudentExamAttempt = require("../../models/OnlineExam/StudentExamAttempt");
const StudentPerformance = require("../../models/OnlineExam/StudentPerformance");
const { SubCategory, Category, StudentMarks, Exam } = require("../../models/MarkEntry/Mark");
const Product = require("../../models/Inventory/product");
const InventoryCategory = require("../../models/Inventory/category");
const InventorySubCategory = require("../../models/Inventory/subCategory");
const Store = require("../../models/Inventory/store");
const Unit = require("../../models/Inventory/unit");
const Stock = require("../../models/Inventory/stock");
const Purchase = require("../../models/Inventory/purchase");
const Sale = require("../../models/Inventory/sales");
const AccountingFeeType = require("../../models/Accounting/feeType");
const StudentFee = require("../../models/Accounting/studentFee");
const SalaryType = require("../../models/Accounting/salaryType");
const TeacherSalary = require("../../models/Accounting/teacherSalary");
const ExpenseHead = require("../../models/Accounting/expenseHead");
const Expense = require("../../models/Accounting/expense");
const AccountTransaction = require("../../models/Accounting/accountTransaction");

const {
	upsertShared,
	upsertDemo,
	createDemo,
	tagDemo,
	pad,
	atHour,
	addDays,
	recentWeekdays,
	crud,
} = require("./helpers");

const DEMO_PASSWORD = "Demo@123";

const SUBJECT_NAMES = [
	"Mathematics",
	"English",
	"Science",
	"Social Studies",
	"Computer Science",
	"Arabic",
	"Islamic Studies",
	"Physical Education",
	"Art",
	"Physics",
	"Chemistry",
	"Biology",
];

const GRADE_SUBJECTS = {
	"Grade 8": [
		"Mathematics",
		"English",
		"Science",
		"Social Studies",
		"Computer Science",
		"Arabic",
		"Physical Education",
		"Art",
	],
	"Grade 9": [
		"Mathematics",
		"English",
		"Science",
		"Social Studies",
		"Computer Science",
		"Arabic",
		"Islamic Studies",
		"Physical Education",
	],
	"Grade 10": [
		"Mathematics",
		"English",
		"Physics",
		"Chemistry",
		"Biology",
		"Computer Science",
		"Arabic",
		"Physical Education",
	],
};

const TEACHER_DEFS = [
	{
		key: "math",
		name: "Priya Nair",
		email: "demo-teacher1@school.local",
		employeeId: "DEMO-EMP-01",
		phone: "9876500101",
		designation: "Head of Mathematics",
		qualification: "M.Sc. Mathematics",
		gender: "female",
		subjects: ["Mathematics"],
	},
	{
		key: "english",
		name: "James Okonkwo",
		email: "demo-teacher2@school.local",
		employeeId: "DEMO-EMP-02",
		phone: "9876500102",
		designation: "English Teacher",
		qualification: "M.A. English",
		gender: "male",
		subjects: ["English", "Art"],
	},
	{
		key: "science",
		name: "Fatima Al-Hassan",
		email: "demo-teacher3@school.local",
		employeeId: "DEMO-EMP-03",
		phone: "9876500103",
		designation: "Science Coordinator",
		qualification: "M.Sc. Physics",
		gender: "female",
		subjects: ["Science", "Physics", "Chemistry", "Biology"],
	},
	{
		key: "cs",
		name: "Rahul Menon",
		email: "demo-teacher4@school.local",
		employeeId: "DEMO-EMP-04",
		phone: "9876500104",
		designation: "ICT Teacher",
		qualification: "B.Tech Computer Science",
		gender: "male",
		subjects: ["Computer Science"],
	},
	{
		key: "humanities",
		name: "Sarah Thomas",
		email: "demo-teacher5@school.local",
		employeeId: "DEMO-EMP-05",
		phone: "9876500105",
		designation: "Humanities Teacher",
		qualification: "M.A. History",
		gender: "female",
		subjects: ["Social Studies", "Arabic", "Islamic Studies", "Physical Education"],
	},
];

const STUDENT_DEFS = [
	{ n: 1, name: "Aisha Rahman", gender: "female", grade: "Grade 8", section: "A", dob: "2012-04-12" },
	{ n: 2, name: "Omar Khalid", gender: "male", grade: "Grade 8", section: "A", dob: "2012-09-03" },
	{ n: 3, name: "Meera Pillai", gender: "female", grade: "Grade 8", section: "A", dob: "2012-01-22" },
	{ n: 4, name: "Arjun Nair", gender: "male", grade: "Grade 8", section: "A", dob: "2012-11-18" },
	{ n: 5, name: "Layla Hassan", gender: "female", grade: "Grade 8", section: "B", dob: "2012-06-07" },
	{ n: 6, name: "Yusuf Ibrahim", gender: "male", grade: "Grade 8", section: "B", dob: "2012-02-14" },
	{ n: 7, name: "Ananya Sharma", gender: "female", grade: "Grade 9", section: "A", dob: "2011-05-19" },
	{ n: 8, name: "Daniel George", gender: "male", grade: "Grade 9", section: "A", dob: "2011-08-30" },
	{ n: 9, name: "Noor Alami", gender: "female", grade: "Grade 9", section: "A", dob: "2011-12-02" },
	{ n: 10, name: "Vikram Patel", gender: "male", grade: "Grade 9", section: "A", dob: "2011-03-25" },
	{ n: 11, name: "Hana Siddiqui", gender: "female", grade: "Grade 9", section: "B", dob: "2011-07-11" },
	{ n: 12, name: "Kevin Mathew", gender: "male", grade: "Grade 9", section: "B", dob: "2011-10-08" },
	{ n: 13, name: "Zara Ahmed", gender: "female", grade: "Grade 10", section: "A", dob: "2010-04-16" },
	{ n: 14, name: "Rohan Iyer", gender: "male", grade: "Grade 10", section: "A", dob: "2010-09-21" },
	{ n: 15, name: "Sofia Fernandes", gender: "female", grade: "Grade 10", section: "A", dob: "2010-01-05" },
	{ n: 16, name: "Aditya Krishnan", gender: "male", grade: "Grade 10", section: "A", dob: "2010-06-28" },
];

function teacherForSubject(ctx, subjectName) {
	const def = TEACHER_DEFS.find((t) => t.subjects.includes(subjectName));
	return def ? ctx.teachers[def.key] : ctx.teachers.math;
}

function academicYearName(now = new Date()) {
	const y = now.getFullYear();
	const startYear = now.getMonth() >= 7 ? y : y - 1;
	return { startYear, name: `${startYear}-${startYear + 1}` };
}

async function seedAdminAndStaff(ctx) {
	console.log("→ Auth / users");
	const email = ctx.adminEmail.toLowerCase().trim();
	let admin = await User.findOne({ email });
	if (admin) {
		admin.name = ctx.adminName;
		admin.phone = ctx.adminPhone;
		admin.role = "admin";
		admin.active = true;
		admin.emailVerified = true;
		admin.password = ctx.adminPassword;
		admin.passwordConfirm = ctx.adminPassword;
		await admin.save();
		console.log(`  Admin upserted (not tagged demo): ${email}`);
	} else {
		admin = await User.create({
			name: ctx.adminName,
			email,
			phone: ctx.adminPhone,
			password: ctx.adminPassword,
			passwordConfirm: ctx.adminPassword,
			role: "admin",
			emailVerified: true,
			active: true,
		});
		console.log(`  Admin created (not tagged demo): ${email}`);
	}
	ctx.adminUser = admin;

	const staff = await upsertDemo(User, { email: "demo-staff@school.local" }, {
		name: "Demo Office Staff",
		email: "demo-staff@school.local",
		phone: "9876500199",
		password: DEMO_PASSWORD,
		passwordConfirm: DEMO_PASSWORD,
		role: "admin",
		emailVerified: true,
		active: true,
	});
	ctx.staffUser = staff;
}

async function seedRoles(ctx) {
	console.log("→ Roles / permissions");
	const teacherPerms = crud([
		"TeacherSelfDashboard",
		"Timetable",
		"SubjectNotes",
		"LessonPlans",
		"PublishedLessonPlans",
		"Information",
		"EventGallery",
		"Attendance",
		"TeacherAttendance",
		"AttendanceReports",
		"ClassFeedback",
		"SubjectFeedback",
		"Exams",
		"QuestionBank",
		"Assignments",
		"PublishedAssignments",
		"ExamMark",
		"ExamMarkDashboard",
		"Library",
		"LibraryMyBooks",
		"Blog",
		"BlogPosts",
		"BlogView",
		"TeacherDashboard",
	]);
	const studentPerms = crud(["StudentDashboard", "BlogView", "LibraryMyBooks"]);
	const librarianPerms = crud([
		"Library",
		"LibraryCategories",
		"LibraryBookCatalog",
		"LibraryRacks",
		"LibraryBooks",
		"LibraryBookIssue",
		"LibraryMyBooks",
	]);

	ctx.teacherRole = await upsertShared(Roles, { roleName: "Teacher" }, {
		roleName: "Teacher",
		permissions: teacherPerms,
	});
	ctx.studentRole = await upsertShared(Roles, { roleName: "Student" }, {
		roleName: "Student",
		permissions: studentPerms,
	});
	ctx.librarianRole = await upsertShared(Roles, { roleName: "Librarian" }, {
		roleName: "Librarian",
		permissions: librarianPerms,
	});
}

async function seedAcademicSetup(ctx) {
	console.log("→ Academic year / terms");
	const { startYear, name } = academicYearName();
	ctx.yearName = name;
	ctx.terms = ["Term 1", "Term 2", "Term 3"];
	ctx.term = "Term 1";

	ctx.academicYear = await upsertShared(
		AcademicYear,
		{ academicYear: name },
		{
			academicYear: name,
			terms: ctx.terms,
			createdBy: ctx.adminUser._id,
			updatedBy: ctx.adminUser._id,
		}
	);

	const ranges = [
		{ term: "Term 1", start: new Date(startYear, 7, 1), end: new Date(startYear, 10, 30), active: true },
		{ term: "Term 2", start: new Date(startYear, 11, 1), end: new Date(startYear + 1, 2, 31), active: false },
		{ term: "Term 3", start: new Date(startYear + 1, 3, 1), end: new Date(startYear + 1, 6, 31), active: false },
	];
	ctx.termHistories = [];
	for (const r of ranges) {
		const th = await upsertDemo(
			TermHistory,
			{ academicYear: ctx.academicYear._id, term: r.term },
			{
				academicYear: ctx.academicYear._id,
				term: r.term,
				startDate: r.start,
				endDate: r.end,
				isActive: r.active,
				description: `${r.term} of ${name}`,
				createdBy: ctx.adminUser._id,
				updatedBy: ctx.adminUser._id,
			}
		);
		ctx.termHistories.push(th);
	}

	console.log("→ Grades / sections / subjects / religions");
	ctx.grades = {};
	for (const gradeName of ["Grade 8", "Grade 9", "Grade 10"]) {
		ctx.grades[gradeName] = await upsertShared(Grade, { gradeName }, {
			gradeName,
			status: "Active",
		});
	}

	ctx.sections = {};
	for (const sectionName of ["A", "B"]) {
		ctx.sections[sectionName] = await upsertShared(Section, { sectionName }, {
			sectionName,
			status: "active",
			createdBy: ctx.adminUser._id,
			updatedBy: ctx.adminUser._id,
		});
	}

	ctx.subjects = {};
	for (const subjectName of SUBJECT_NAMES) {
		ctx.subjects[subjectName] = await upsertShared(Subject, { subjectName }, {
			subjectName,
			status: "active",
		});
	}

	ctx.religions = {};
	for (const religionName of ["Islam", "Christianity", "Hinduism", "Other"]) {
		ctx.religions[religionName] = await upsertShared(Religion, { religionName }, {
			religionName,
			status: "Active",
		});
	}

	ctx.country = await Country.findOne({ iso2: "IN" }) || await Country.findOne();
	if (ctx.country) {
		ctx.state = await State.findOne({ country_id: ctx.country._id }) || await State.findOne();
		if (ctx.state) {
			ctx.city = await City.findOne({ state_id: ctx.state._id }) || await City.findOne();
		}
	}
	if (!ctx.country) {
		console.log("  Countries not seeded — skipping nationality refs (run countries seeder if needed).");
	}

	console.log("→ Settings");
	const settingsData = {
		academicYear: ctx.academicYear._id,
		term: ctx.term,
		librarySettings: {
			maxBooksForStudent: 3,
			maxBooksForTeacher: 5,
			bookIssueDuration: 14,
			maxRenewals: 2,
			finePerDay: 1,
			gracePeriod: 3,
		},
		schoolTimings: {
			default: {
				startTime: "08:00",
				endTime: "15:00",
				lunchStartTime: "12:00",
				lunchEndTime: "13:00",
				totalHours: 7,
				periodDuration: 45,
				totalPeriods: 8,
				breaks: [
					{ name: "Short Break", startTime: "10:15", endTime: "10:30", duration: 15 },
					{ name: "Lunch", startTime: "12:00", endTime: "13:00", duration: 60 },
				],
			},
		},
		attendanceSettings: { modificationTime: "23:59" },
	};
	const existingSettings = await Settings.findOne();
	if (existingSettings) {
		existingSettings.academicYear = ctx.academicYear._id;
		existingSettings.term = ctx.term;
		existingSettings.librarySettings = settingsData.librarySettings;
		existingSettings.schoolTimings = settingsData.schoolTimings;
		existingSettings.attendanceSettings = settingsData.attendanceSettings;
		await existingSettings.save();
		ctx.settings = existingSettings;
		console.log("  Settings updated (existing document left untagged).");
	} else {
		ctx.settings = await upsertShared(Settings, {}, settingsData);
	}
}

async function seedPeople(ctx) {
	console.log("→ Teachers");
	ctx.teachers = {};
	const religionIds = Object.values(ctx.religions);
	for (let i = 0; i < TEACHER_DEFS.length; i += 1) {
		const def = TEACHER_DEFS[i];
		const user = await upsertDemo(User, { email: def.email }, {
			name: def.name,
			email: def.email,
			phone: def.phone,
			password: DEMO_PASSWORD,
			passwordConfirm: DEMO_PASSWORD,
			role: "user",
			emailVerified: true,
			active: true,
		});
		const teacher = await upsertDemo(Teacher, { email: def.email }, {
			employeeName: def.name,
			employeeId: def.employeeId,
			contactNo: def.phone,
			email: def.email,
			userId: user._id,
			role: ctx.teacherRole._id,
			designation: def.designation,
			qualification: def.qualification,
			gender: def.gender,
			Religion: religionIds[i % religionIds.length]._id,
			dateOfJoining: new Date(ctx.academicYear.createdAt || Date.now()),
			experienceInYears: 4 + i,
			place: "Demo City",
			City: ctx.city ? ctx.city._id : undefined,
			Province: ctx.state ? ctx.state._id : undefined,
			nationality: ctx.country ? ctx.country._id : undefined,
			communicationAddress: "12 Demo Street, Campus Housing",
			permanentAddress: "12 Demo Street, Campus Housing",
			status: "active",
		});
		ctx.teachers[def.key] = teacher;
		ctx.teachers[def.key].user = user;
	}

	console.log("→ Students");
	ctx.students = [];
	const fathers = ["Rahman", "Khalid", "Pillai", "Nair", "Hassan", "Ibrahim", "Sharma", "George"];
	for (const def of STUDENT_DEFS) {
		const email = `demo-student${pad(def.n)}@school.local`;
		const studentID = `DEMO-STU-${pad(def.n)}`;
		const phone = `98765101${pad(def.n)}`;
		const user = await upsertDemo(User, { email }, {
			name: def.name,
			email,
			phone,
			password: DEMO_PASSWORD,
			passwordConfirm: DEMO_PASSWORD,
			role: "student",
			emailVerified: true,
			active: true,
		});
		const student = await upsertDemo(Student, { studentID }, {
			studentID,
			studentName: def.name,
			Dob: def.dob,
			grade: ctx.grades[def.grade]._id,
			gender: def.gender,
			section: ctx.sections[def.section]._id,
			Father_name: `${fathers[def.n % fathers.length]} ${def.name.split(" ").slice(-1)[0]}`,
			Mother_name: `Amina ${def.name.split(" ").slice(-1)[0]}`,
			contactNo: phone,
			Communication_no: phone,
			academicYear: ctx.academicYear._id,
			Admission_date: new Date(academicYearName().startYear, 7, 5),
			Religion: religionIds[def.n % religionIds.length]._id,
			Email: email,
			Place_of_birth: "Demo City",
			City: ctx.city ? ctx.city._id : undefined,
			Communication_Address: `${def.n} Palm Avenue, Demo City`,
			Permanent_Address: `${def.n} Palm Avenue, Demo City`,
			Nationality: ctx.country ? ctx.country._id : undefined,
			Province: ctx.state ? ctx.state._id : undefined,
			Transport_Pickup: def.n % 2 === 0 ? "School Bus" : "Parents",
			Transport_Drop: def.n % 2 === 0 ? "School Bus" : "Parents",
			userId: user._id,
			role: ctx.studentRole._id,
		});
		student.user = user;
		student._gradeName = def.grade;
		student._sectionName = def.section;
		ctx.students.push(student);

		await upsertDemo(
			AcademicStudent,
			{ studentId: student._id, academicYear: ctx.academicYear._id },
			{
				studentId: student._id,
				academicYear: ctx.academicYear._id,
				grade: student.grade,
				gender: student.gender,
				section: student.section,
				startDate: new Date(academicYearName().startYear, 7, 1),
				status: "active",
			}
		);
		await upsertDemo(
			SectionHistory,
			{ studentId: student._id, academicYear: ctx.academicYear._id, section: student.section },
			{
				academicYear: ctx.academicYear._id,
				section: student.section,
				studentId: student._id,
				startDate: new Date(academicYearName().startYear, 7, 1),
			}
		);
	}
	ctx.academicStudents = await AcademicStudent.find({
		studentId: { $in: ctx.students.map((s) => s._id) },
		academicYear: ctx.academicYear._id,
	});
}

async function seedCurriculum(ctx) {
	console.log("→ Grade subjects / group subjects / permissions");
	ctx.gradeSubjects = [];
	const genders = ["male", "female"];
	for (const [gradeName, subjectNames] of Object.entries(GRADE_SUBJECTS)) {
		for (const sectionName of ["A", "B"]) {
			for (const gender of genders) {
				for (const subjectName of subjectNames) {
					const teacher = teacherForSubject(ctx, subjectName);
					const gs = await upsertDemo(
						GradeSubject,
						{
							academicYear: ctx.academicYear._id,
							grade: ctx.grades[gradeName]._id,
							gender,
							section: ctx.sections[sectionName]._id,
							subject: ctx.subjects[subjectName]._id,
						},
						{
							academicYear: ctx.academicYear._id,
							grade: ctx.grades[gradeName]._id,
							gender,
							section: ctx.sections[sectionName]._id,
							subject: ctx.subjects[subjectName]._id,
							type: "common",
							teacher: teacher._id,
							Status: "active",
						}
					);
					gs._gradeName = gradeName;
					gs._sectionName = sectionName;
					gs._subjectName = subjectName;
					ctx.gradeSubjects.push(gs);
				}
			}
		}
	}

	ctx.groupSubject = await upsertDemo(
		GroupSubject,
		{
			academicYear: ctx.academicYear._id,
			grade: ctx.grades["Grade 10"]._id,
			gender: "male",
			section: ctx.sections.A._id,
			groupName: "Science Stream",
		},
		{
			academicYear: ctx.academicYear._id,
			grade: ctx.grades["Grade 10"]._id,
			gender: "male",
			section: ctx.sections.A._id,
			groupName: "Science Stream",
			subjects: [
				ctx.subjects.Physics._id,
				ctx.subjects.Chemistry._id,
				ctx.subjects.Biology._id,
			],
			status: "active",
		}
	);

	const classTeacherPairs = [
		{ grade: "Grade 8", section: "A", gender: "male", teacher: "math" },
		{ grade: "Grade 8", section: "A", gender: "female", teacher: "science" },
		{ grade: "Grade 9", section: "A", gender: "male", teacher: "english" },
		{ grade: "Grade 10", section: "A", gender: "male", teacher: "cs" },
	];
	for (const p of classTeacherPairs) {
		await upsertDemo(
			ClassTeacher,
			{
				academicYear: ctx.academicYear._id,
				grade: ctx.grades[p.grade]._id,
				gender: p.gender,
				section: ctx.sections[p.section]._id,
			},
			{
				academicYear: ctx.academicYear._id,
				grade: ctx.grades[p.grade]._id,
				gender: p.gender,
				section: ctx.sections[p.section]._id,
				teacher: ctx.teachers[p.teacher]._id,
			}
		);
	}

	await upsertDemo(
		GradePermission,
		{ academicYear: ctx.academicYear._id, teacherId: ctx.teachers.math._id, grade: ctx.grades["Grade 8"]._id },
		{
			academicYear: ctx.academicYear._id,
			grade: ctx.grades["Grade 8"]._id,
			gender: ["male", "female"],
			teacherId: ctx.teachers.math._id,
			createdBy: ctx.adminUser._id,
		}
	);
	await upsertDemo(
		SubjectPermission,
		{
			academicYear: ctx.academicYear._id,
			grade: ctx.grades["Grade 8"]._id,
			gender: "male",
			section: ctx.sections.A._id,
			teacher: ctx.teachers.math._id,
		},
		{
			academicYear: ctx.academicYear._id,
			grade: ctx.grades["Grade 8"]._id,
			gender: "male",
			section: ctx.sections.A._id,
			subjects: [ctx.subjects.Mathematics._id],
			teacher: ctx.teachers.math._id,
			createdBy: ctx.adminUser._id,
		}
	);

	console.log("→ Student subject enrollments");
	for (const student of ctx.students) {
		const subjectNames = GRADE_SUBJECTS[student._gradeName] || [];
		for (const subjectName of subjectNames) {
			await upsertDemo(
				StudentSubject,
				{
					academicYear: ctx.academicYear._id,
					grade: student.grade,
					gender: student.gender,
					section: student.section,
					subject: ctx.subjects[subjectName]._id,
					studentId: student._id,
				},
				{
					academicYear: ctx.academicYear._id,
					grade: student.grade,
					gender: student.gender,
					section: student.section,
					subject: ctx.subjects[subjectName]._id,
					studentId: student._id,
					status: "active",
				}
			);
		}
	}
}

function period(n, start, end, extra) {
	return {
		period: n,
		startTime: start,
		endTime: end,
		duration: extra.isBreak ? extra.duration : 45,
		room: extra.room || "R-101",
		...extra,
	};
}

async function seedTimetable(ctx) {
	console.log("→ Timetable");
	const pickGs = (subjectName, gender = "male", section = "A", grade = "Grade 8") =>
		ctx.gradeSubjects.find(
			(g) =>
				g._subjectName === subjectName &&
				g.gender === gender &&
				g._sectionName === section &&
				g._gradeName === grade
		);

	const buildDay = (gender) => {
		const math = pickGs("Mathematics", gender);
		const eng = pickGs("English", gender);
		const sci = pickGs("Science", gender);
		const cs = pickGs("Computer Science", gender);
		const soc = pickGs("Social Studies", gender);
		const pe = pickGs("Physical Education", gender);
		return [
			period(1, "08:00", "08:45", { gradeSubject: math && math._id, subject: ctx.subjects.Mathematics._id, teacher: ctx.teachers.math._id }),
			period(2, "08:45", "09:30", { gradeSubject: eng && eng._id, subject: ctx.subjects.English._id, teacher: ctx.teachers.english._id }),
			period(3, "09:30", "10:15", { gradeSubject: sci && sci._id, subject: ctx.subjects.Science._id, teacher: ctx.teachers.science._id }),
			period(4, "10:15", "10:30", { isBreak: true, breakType: "short", breakName: "Short Break", duration: 15, subject: "Break" }),
			period(5, "10:30", "11:15", { gradeSubject: cs && cs._id, subject: ctx.subjects["Computer Science"]._id, teacher: ctx.teachers.cs._id }),
			period(6, "11:15", "12:00", { gradeSubject: soc && soc._id, subject: ctx.subjects["Social Studies"]._id, teacher: ctx.teachers.humanities._id }),
			period(7, "12:00", "13:00", { isBreak: true, breakType: "lunch", breakName: "Lunch", duration: 60, subject: "Lunch" }),
			period(8, "13:00", "13:45", { gradeSubject: pe && pe._id, subject: ctx.subjects["Physical Education"]._id, teacher: ctx.teachers.humanities._id }),
		];
	};

	await upsertDemo(
		Timetable,
		{
			academicYear: ctx.academicYear._id,
			term: ctx.term,
			grade: ctx.grades["Grade 8"]._id,
			gender: "male",
			section: ctx.sections.A._id,
		},
		{
			name: "Grade 8A Boys — Term 1",
			academicYear: ctx.academicYear._id,
			term: ctx.term,
			grade: ctx.grades["Grade 8"]._id,
			gender: "male",
			section: ctx.sections.A._id,
			weeklyTimetable: {
				monday: buildDay("male"),
				tuesday: buildDay("male"),
				wednesday: buildDay("male"),
				thursday: buildDay("male"),
				friday: buildDay("male"),
				saturday: [],
				sunday: [],
			},
			status: "published",
			createdBy: ctx.adminUser._id,
			updatedBy: ctx.adminUser._id,
			notes: "Demo timetable",
		}
	);

	await upsertDemo(
		Timetable,
		{
			academicYear: ctx.academicYear._id,
			term: ctx.term,
			grade: ctx.grades["Grade 8"]._id,
			gender: "female",
			section: ctx.sections.A._id,
		},
		{
			name: "Grade 8A Girls — Term 1 (draft)",
			academicYear: ctx.academicYear._id,
			term: ctx.term,
			grade: ctx.grades["Grade 8"]._id,
			gender: "female",
			section: ctx.sections.A._id,
			weeklyTimetable: {
				monday: buildDay("female"),
				tuesday: [],
				wednesday: [],
				thursday: [],
				friday: [],
				saturday: [],
				sunday: [],
			},
			status: "draft",
			createdBy: ctx.adminUser._id,
			updatedBy: ctx.adminUser._id,
			notes: "Draft demo timetable",
		}
	);
}

async function seedAttendance(ctx) {
	console.log("→ Attendance");
	const days = recentWeekdays(5);
	const sample = ctx.students.filter((s) => s._gradeName === "Grade 8");
	for (const day of days) {
		for (const student of sample) {
			const absent = student.studentID.endsWith("06") && day.getDay() === 1;
			const late = student.studentID.endsWith("03") && day.getDay() === 2;
			await upsertDemo(
				Attendance,
				{ student: student._id, date: atHour(day, 0, 0), attendanceType: "student" },
				{
					student: student._id,
					attendanceType: "student",
					date: atHour(day, 0, 0),
					timeIn: atHour(day, late ? 8 : 7, late ? 20 : 50),
					timeOut: atHour(day, 15, 0),
					attendanceMethod: "manual",
					status: absent ? "absent" : late ? "late" : "present",
					academicYear: ctx.academicYear._id,
					grade: student.grade,
					notes: absent ? "Demo sick leave" : "",
					verifiedBy: ctx.adminUser._id,
					verifiedAt: atHour(day, 16, 0),
					isActive: true,
				}
			);
		}
	}
	for (const day of days.slice(0, 3)) {
		await upsertDemo(
			Attendance,
			{ teacher: ctx.teachers.math._id, date: atHour(day, 0, 0), attendanceType: "teacher" },
			{
				teacher: ctx.teachers.math._id,
				attendanceType: "teacher",
				date: atHour(day, 0, 0),
				timeIn: atHour(day, 7, 40),
				timeOut: atHour(day, 15, 10),
				attendanceMethod: "web",
				status: "present",
				academicYear: ctx.academicYear._id,
				verifiedBy: ctx.adminUser._id,
				isActive: true,
			}
		);
	}
}

async function seedAssignmentsAndExams(ctx) {
	console.log("→ Assignments");
	const g8 = ctx.grades["Grade 8"];
	const math = ctx.subjects.Mathematics;
	const assignment = await upsertDemo(
		Assignment,
		{
			assignmentName: "Demo Algebra Worksheet 1",
			academicYear: ctx.academicYear._id,
			grade: g8._id,
			term: ctx.term,
			subjectId: math._id,
		},
		{
			assignmentName: "Demo Algebra Worksheet 1",
			academicYear: ctx.academicYear._id,
			grade: g8._id,
			term: ctx.term,
			subjectId: math._id,
			question: "Solve the linear equations in the worksheet and show your working.",
			supportingNotes: "Use pencil. Calculators are not allowed.",
			status: "active",
			createdBy: ctx.adminUser._id,
			updatedBy: ctx.adminUser._id,
		}
	);
	await upsertDemo(
		Assignment,
		{
			assignmentName: "Demo Reading Log (draft)",
			academicYear: ctx.academicYear._id,
			grade: g8._id,
			term: ctx.term,
			subjectId: ctx.subjects.English._id,
		},
		{
			assignmentName: "Demo Reading Log (draft)",
			academicYear: ctx.academicYear._id,
			grade: g8._id,
			term: ctx.term,
			subjectId: ctx.subjects.English._id,
			question: "Keep a reading log for any two short stories.",
			status: "inactive",
			createdBy: ctx.adminUser._id,
			updatedBy: ctx.adminUser._id,
		}
	);

	const start = addDays(new Date(), -3);
	const end = addDays(new Date(), 10);
	const published = await upsertDemo(
		PublishAssignment,
		{ assignment: assignment._id, section: ctx.sections.A._id, gender: "male" },
		{
			assignment: assignment._id,
			grade: g8._id,
			gender: "male",
			section: ctx.sections.A._id,
			startDate: start,
			endDate: end,
			totalUsersSelected: 2,
			attendedUsers: 1,
			createdBy: ctx.adminUser._id,
			updatedBy: ctx.adminUser._id,
		}
	);
	const omar = ctx.students.find((s) => s.studentID === "DEMO-STU-02");
	if (omar) {
		await upsertDemo(
			StudentAssignmentAttempt,
			{ studentId: omar._id, publishId: published._id },
			{
				studentId: omar._id,
				publishId: published._id,
				attendedStatus: true,
				attendedDate: addDays(new Date(), -1),
				studentAnswer: "x = 4, y = -1. Working attached in notes.",
				teacherRemarks: "Clear method. Watch signs on step 3.",
				teacherId: ctx.teachers.math._id,
			}
		);
	}

	console.log("→ Online exams");
	const bank = await upsertDemo(
		QuestionBank,
		{ subject: math._id, questionBankName: "Demo Grade 8 Algebra Bank" },
		{
			subject: math._id,
			questionBankName: "Demo Grade 8 Algebra Bank",
			grades: [g8._id],
			status: "active",
			createdBy: ctx.adminUser._id,
			updatedBy: ctx.adminUser._id,
		}
	);

	const qDefs = [
		{
			questionType: "objective",
			questionText: "What is the value of 2x + 3 when x = 4?",
			options: [
				{ type: "text", value: "8" },
				{ type: "text", value: "11" },
				{ type: "text", value: "10" },
				{ type: "text", value: "7" },
			],
			correctAnswer: "11",
			marks: 1,
		},
		{
			questionType: "true/false",
			questionText: "The sum of the interior angles of a triangle is 180 degrees.",
			correctAnswer: "true",
			marks: 1,
			options: [],
		},
		{
			questionType: "fill-in-the-blanks",
			questionText: "The square of 9 is ____.",
			correctAnswer: "81",
			marks: 1,
			options: [],
		},
		{
			questionType: "objective",
			questionText: "Which of these is a prime number?",
			options: [
				{ type: "text", value: "21" },
				{ type: "text", value: "27" },
				{ type: "text", value: "29" },
				{ type: "text", value: "33" },
			],
			correctAnswer: "29",
			marks: 1,
		},
	];
	const questions = [];
	for (const q of qDefs) {
		const existing = await Question.findOne({ questionBank: bank._id, questionText: q.questionText });
		if (existing) {
			Object.assign(existing, { ...q, questionBank: bank._id });
			await existing.save();
			await tagDemo(Question, existing._id);
			questions.push(existing);
		} else {
			questions.push(await createDemo(Question, { ...q, questionBank: bank._id }));
		}
	}

	const exam = await upsertDemo(
		OnlineExam,
		{
			examName: "Demo Algebra Check",
			academicYear: ctx.academicYear._id,
			grade: g8._id,
			term: ctx.term,
			subjectId: math._id,
		},
		{
			examName: "Demo Algebra Check",
			academicYear: ctx.academicYear._id,
			grade: g8._id,
			term: ctx.term,
			subjectId: math._id,
			status: "active",
			createdBy: ctx.adminUser._id,
			updatedBy: ctx.adminUser._id,
		}
	);
	await upsertDemo(
		OnlineExam,
		{
			examName: "Demo Geometry Quiz (inactive)",
			academicYear: ctx.academicYear._id,
			grade: g8._id,
			term: ctx.term,
			subjectId: math._id,
		},
		{
			examName: "Demo Geometry Quiz (inactive)",
			academicYear: ctx.academicYear._id,
			grade: g8._id,
			term: ctx.term,
			subjectId: math._id,
			status: "inactive",
			createdBy: ctx.adminUser._id,
			updatedBy: ctx.adminUser._id,
		}
	);

	const pubExam = await upsertDemo(
		Publish,
		{ exam: exam._id, section: ctx.sections.A._id, gender: "male" },
		{
			exam: exam._id,
			questionBank: bank._id,
			grade: g8._id,
			gender: "male",
			section: ctx.sections.A._id,
			numberOfQuestions: 4,
			duration: 20 * 60,
			startDate: addDays(new Date(), -2),
			endDate: addDays(new Date(), 7),
			totalUsersSelected: 2,
			attendedUsers: 1,
			totalQuestionsInBank: questions.length,
			createdBy: ctx.adminUser._id,
			updatedBy: ctx.adminUser._id,
		}
	);
	if (omar) {
		await upsertDemo(
			StudentExamAttempt,
			{ studentId: omar._id, publishId: pubExam._id },
			{
				studentId: omar._id,
				publishId: pubExam._id,
				securedMark: 3,
				attendedStatus: true,
				totalQuestions: 4,
				attendedDate: addDays(new Date(), -1),
				teacherRemarks: "Good attempt.",
				studentAnswers: questions.map((q, i) => ({
					questionId: q._id,
					studentAnswer: i === 0 ? "10" : q.correctAnswer,
				})),
				teacherId: ctx.teachers.math._id,
			}
		);
		await upsertDemo(
			StudentPerformance,
			{ studentId: omar._id, examId: exam._id },
			{
				studentId: omar._id,
				examId: exam._id,
				bestMarkSecured: 3,
				attempts: 1,
				totalMarksArray: [{ publishId: pubExam._id, marks: 3 }],
			}
		);
	}

	console.log("→ Exam marks");
	const markExam = await upsertDemo(
		Exam,
		{ academicYear: ctx.academicYear._id, term: ctx.term, examName: "Demo Midterm" },
		{
			academicYear: ctx.academicYear._id,
			term: ctx.term,
			examName: "Demo Midterm",
			examDate: addDays(new Date(), -14),
			publishDate: addDays(new Date(), -7),
			status: "active",
		}
	);
	const subCat = await upsertDemo(
		SubCategory,
		{ name: "Written Paper", academicYear: ctx.academicYear._id, term: ctx.term, grade: g8._id, subject: math._id },
		{
			name: "Written Paper",
			mark: 80,
			academicYear: ctx.academicYear._id,
			term: ctx.term,
			grade: g8._id,
			subject: math._id,
			examName: markExam._id,
		}
	);
	const cat = await upsertDemo(
		Category,
		{
			categoryName: "Summative",
			academicYear: ctx.academicYear._id,
			term: ctx.term,
			grade: g8._id,
			subject: math._id,
			examName: "Demo Midterm",
		},
		{
			categoryName: "Summative",
			mark: 80,
			academicYear: ctx.academicYear._id,
			term: ctx.term,
			grade: g8._id,
			subject: math._id,
			examName: "Demo Midterm",
			subCategory: [subCat._id],
			status: "active",
		}
	);
	const g8MathStudents = ctx.students.filter(
		(s) => s._gradeName === "Grade 8" && s._sectionName === "A"
	);
	for (const student of g8MathStudents) {
		const scored = 60 + (student.n ? 0 : 0) + (parseInt(student.studentID.slice(-2), 10) % 15);
		await upsertDemo(
			StudentMarks,
			{
				studentId: student._id,
				academicYear: ctx.academicYear._id,
				term: ctx.term,
				subject: math._id,
				examName: markExam._id,
			},
			{
				studentId: student._id,
				academicYear: ctx.academicYear._id,
				term: ctx.term,
				grade: g8._id,
				subject: math._id,
				examName: markExam._id,
				categoryMark: [
					{
						categoryId: cat._id,
						mark: 80,
						studentMark: scored,
						subCategories: [{ subcategoryId: subCat._id, mark: 80, studentMark: scored }],
					},
				],
				mark: 80,
				studentMark: scored,
				status: "present",
			}
		);
	}
}

async function seedLibrary(ctx) {
	console.log("→ Library");
	const fiction = await upsertDemo(BookCategory, { name: "Demo Fiction" }, {
		name: "Demo Fiction",
		description: "Story books for middle school",
		isActive: true,
	});
	const reference = await upsertDemo(BookCategory, { name: "Demo Reference" }, {
		name: "Demo Reference",
		description: "Subject reference titles",
		isActive: true,
	});
	const rack = await upsertDemo(Rack, { rackNumber: "DEMO-R1" }, {
		rackNumber: "DEMO-R1",
		description: "Main hall rack 1",
		numberOfRows: 5,
		isActive: true,
	});

	const catalogs = [
		{
			isbn: "9789000000001",
			title: "The Demo Adventure",
			author: "A. Storyteller",
			publisher: "Campus Press",
			publicationYear: 2022,
			category: fiction._id,
			subject: "English",
			pages: 180,
			price: 12,
		},
		{
			isbn: "9789000000002",
			title: "Algebra Made Clear",
			author: "P. Nair",
			publisher: "Edu Books",
			publicationYear: 2023,
			category: reference._id,
			subject: "Mathematics",
			pages: 240,
			price: 18,
		},
		{
			isbn: "9789000000003",
			title: "Our Living Planet",
			author: "F. Al-Hassan",
			publisher: "Science House",
			publicationYear: 2021,
			category: reference._id,
			subject: "Science",
			pages: 210,
			price: 16,
		},
	];
	const copies = [];
	for (let i = 0; i < catalogs.length; i += 1) {
		const cat = await upsertDemo(BookCatalog, { isbn: catalogs[i].isbn }, {
			...catalogs[i],
			edition: "1st",
			language: "English",
			description: "Demo catalog title",
			isActive: true,
		});
		const copy = await upsertDemo(
			Book,
			{ copyNumber: `DEMO-COPY-${pad(i + 1)}` },
			{
				bookCatalog: cat._id,
				copyNumber: `DEMO-COPY-${pad(i + 1)}`,
				rack: rack._id,
				row: 1,
				position: i + 1,
				status: i === 0 ? "issued" : "available",
				condition: "good",
				description: "Demo copy",
				isActive: true,
			}
		);
		copies.push(copy);
	}

	const borrower = ctx.students[1];
	if (borrower && copies[0]) {
		await upsertDemo(
			BookIssue,
			{ book: copies[0]._id, issuedTo: borrower._id, status: "issued" },
			{
				book: copies[0]._id,
				issuedTo: borrower._id,
				issuedToModel: "Student",
				issuedBy: ctx.adminUser._id,
				issueDate: addDays(new Date(), -5),
				dueDate: addDays(new Date(), 9),
				status: "issued",
				issueNotes: "Demo issue",
			}
		);
	}
	if (ctx.teachers.math && copies[1]) {
		await upsertDemo(
			BookIssue,
			{ book: copies[1]._id, issuedTo: ctx.teachers.math._id, status: "returned" },
			{
				book: copies[1]._id,
				issuedTo: ctx.teachers.math._id,
				issuedToModel: "Teacher",
				issuedBy: ctx.adminUser._id,
				issueDate: addDays(new Date(), -20),
				dueDate: addDays(new Date(), -6),
				returnDate: addDays(new Date(), -7),
				returnedTo: ctx.adminUser._id,
				status: "returned",
				returnNotes: "Returned on time",
			}
		);
	}
}

async function seedInventory(ctx) {
	console.log("→ Inventory");
	const stationery = await upsertDemo(InventoryCategory, { name: "Demo Stationery" }, {
		name: "Demo Stationery",
		description: "Classroom stationery",
	});
	const uniforms = await upsertDemo(InventoryCategory, { name: "Demo Uniforms" }, {
		name: "Demo Uniforms",
		description: "School uniforms",
	});
	const pens = await upsertDemo(
		InventorySubCategory,
		{ name: "Pens", categoryId: stationery._id },
		{ name: "Pens", categoryId: stationery._id, description: "Writing pens", status: "active" }
	);
	const shirts = await upsertDemo(
		InventorySubCategory,
		{ name: "Shirts", categoryId: uniforms._id },
		{ name: "Shirts", categoryId: uniforms._id, description: "Uniform shirts", status: "active" }
	);
	const piece = await upsertShared(Unit, { name: "Piece" }, { name: "Piece" });
	const pack = await upsertShared(Unit, { name: "Pack" }, { name: "Pack" });
	const store = await upsertDemo(Store, { storeName: "Demo Main Store" }, {
		storeName: "Demo Main Store",
		location: "Admin Block, Ground Floor",
	});

	const products = [
		{
			productName: "Blue Ballpoint Pen",
			productCategory: stationery._id,
			subCategory: pens._id,
			productStatus: "In Stock",
			productCode: "DEMO-PRD-01",
		},
		{
			productName: "Graph Notebook",
			productCategory: stationery._id,
			subCategory: pens._id,
			productStatus: "In Stock",
			productCode: "DEMO-PRD-02",
		},
		{
			productName: "House T-Shirt",
			productCategory: uniforms._id,
			subCategory: shirts._id,
			productStatus: "Low Stock",
			productCode: "DEMO-PRD-03",
		},
	];
	ctx.products = [];
	for (const p of products) {
		ctx.products.push(await upsertDemo(Product, { productCode: p.productCode }, p));
	}

	await upsertDemo(
		Stock,
		{ productId: ctx.products[0]._id, store: store._id },
		{
			productId: ctx.products[0]._id,
			totalQuantity: 200,
			unit: piece._id,
			store: store._id,
			batches: [
				{
					batchCode: "DEMO-BATCH-01",
					totalQuantity: 200,
					remainingQuantity: 188,
					sellingPrice: 10,
					purchasePrice: 6,
				},
			],
		}
	);

	await upsertDemo(Purchase, { purchaseCode: "DEMO-PUR-01" }, {
		purchaseCode: "DEMO-PUR-01",
		store: store._id,
		supplier: "Demo Stationery Mart",
		date: addDays(new Date(), -12),
		totalAmount: 1200,
		products: [
			{
				productId: ctx.products[0]._id,
				quantity: 200,
				unit: piece._id,
				price: 1200,
				unitPrice: 6,
				sellingPrice: 10,
			},
		],
	});

	const buyer = ctx.students[0] && ctx.students[0].user;
	if (buyer) {
		await upsertDemo(Sale, { saleCode: "DEMO-SAL-01" }, {
			saleCode: "DEMO-SAL-01",
			user: buyer._id,
			userRole: "student",
			store: store._id,
			date: addDays(new Date(), -2),
			totalAmount: 20,
			products: [
				{
					batchCode: "DEMO-BATCH-01",
					purchasePrice: 6,
					productId: ctx.products[0]._id,
					quantity: 2,
					unit: piece._id,
					price: 20,
					unitPrice: 10,
				},
			],
		});
	}
	ctx.inventory = { store, piece, pack };
}

async function seedContent(ctx) {
	console.log("→ Blog");
	const post1 = await upsertDemo(Post, { slug: "demo-annual-sports-day-highlights" }, {
		title: "Demo: Annual Sports Day Highlights",
		content:
			"Students from Grades 8–10 took part in track, field, and house games. Congratulations to the winning house and to every volunteer who made the day possible.",
		excerpt: "A recap of this year's sports day.",
		author: ctx.adminUser._id,
		authorRole: "admin",
		status: "published",
		category: "sports",
		tags: ["sports", "demo"],
		publishedAt: addDays(new Date(), -4),
		approvedBy: ctx.adminUser._id,
		approvedAt: addDays(new Date(), -4),
		isFeatured: true,
		isActive: true,
	});
	await upsertDemo(Post, { slug: "demo-science-fair-call-for-projects" }, {
		title: "Demo: Science Fair Call for Projects",
		content: "Submit a one-page proposal to your science teacher by Friday. Themes: climate, robotics, health.",
		excerpt: "Open call for the term science fair.",
		author: ctx.teachers.science.user._id,
		authorRole: "teacher",
		status: "published",
		category: "academic",
		tags: ["science", "demo"],
		publishedAt: addDays(new Date(), -2),
		isActive: true,
	});
	await upsertDemo(Post, { slug: "demo-library-week-draft" }, {
		title: "Demo: Library Week (draft)",
		content: "Draft announcement for library week activities.",
		excerpt: "Draft post",
		author: ctx.teachers.english.user._id,
		authorRole: "teacher",
		status: "draft",
		category: "events",
		tags: ["library", "demo"],
		isActive: true,
	});
	const c1 = await upsertDemo(
		Comment,
		{ post: post1._id, user: ctx.teachers.english.user._id, content: "Fantastic turnout this year!" },
		{
			post: post1._id,
			user: ctx.teachers.english.user._id,
			content: "Fantastic turnout this year!",
			isApproved: true,
			isActive: true,
		}
	);
	const studentUser = ctx.students[0] && ctx.students[0].user;
	if (studentUser) {
		await upsertDemo(
			Comment,
			{ post: post1._id, user: studentUser._id, content: "Proud of our house!" },
			{
				post: post1._id,
				user: studentUser._id,
				content: "Proud of our house!",
				parentComment: c1._id,
				isApproved: true,
				isActive: true,
			}
		);
	}

	console.log("→ Subject notes / chapters / lesson plans");
	const g8 = ctx.grades["Grade 8"];
	const math = ctx.subjects.Mathematics;
	const note = await upsertDemo(
		SubjectNotes,
		{ title: "Demo: Linear Equations Notes", academicYear: ctx.academicYear._id, subject: math._id },
		{
			title: "Demo: Linear Equations Notes",
			description: "Worked examples for one-variable linear equations.",
			academicYear: ctx.academicYear._id,
			grade: g8._id,
			gender: "male",
			section: ctx.sections.A._id,
			subject: math._id,
			status: "published",
			publishedAt: addDays(new Date(), -6),
			createdBy: ctx.adminUser._id,
			updatedBy: ctx.adminUser._id,
			tags: ["algebra", "demo"],
			priority: "medium",
			documents: [
				{
					fileName: "linear-equations.html",
					originalName: "linear-equations.html",
					filePath: "https://example.com/demo/linear-equations",
					fileSize: 0,
					mimeType: "text/html",
					isLink: true,
					linkUrl: "https://example.com/demo/linear-equations",
				},
			],
		}
	);
	await upsertDemo(
		SubjectNotes,
		{ title: "Demo: Poetry Devices (draft)", academicYear: ctx.academicYear._id, subject: ctx.subjects.English._id },
		{
			title: "Demo: Poetry Devices (draft)",
			description: "Draft notes on metaphor and simile.",
			academicYear: ctx.academicYear._id,
			grade: g8._id,
			subject: ctx.subjects.English._id,
			status: "draft",
			createdBy: ctx.adminUser._id,
			updatedBy: ctx.adminUser._id,
			tags: ["english", "demo"],
		}
	);
	await upsertDemo(
		PublishedSubjectNotes,
		{ subjectNote: note._id, gender: "male", section: ctx.sections.A._id },
		{
			subjectNote: note._id,
			academicYear: ctx.academicYear._id,
			grade: g8._id,
			gender: "male",
			section: ctx.sections.A._id,
			subject: math._id,
			publishedBy: ctx.adminUser._id,
			status: "active",
		}
	);

	const chapter = await upsertDemo(
		Chapter,
		{ chapterName: "Demo: Linear Equations", academicYear: ctx.academicYear._id, subject: math._id, grade: g8._id },
		{
			chapterName: "Demo: Linear Equations",
			description: "Introduction to solving linear equations.",
			academicYear: ctx.academicYear._id,
			grade: g8._id,
			subject: math._id,
			status: "active",
			createdBy: ctx.adminUser._id,
			updatedBy: ctx.adminUser._id,
		}
	);
	await upsertDemo(
		Chapter,
		{ chapterName: "Demo: Photosynthesis", academicYear: ctx.academicYear._id, subject: ctx.subjects.Science._id, grade: g8._id },
		{
			chapterName: "Demo: Photosynthesis",
			description: "How plants make food.",
			academicYear: ctx.academicYear._id,
			grade: g8._id,
			subject: ctx.subjects.Science._id,
			status: "active",
			createdBy: ctx.adminUser._id,
			updatedBy: ctx.adminUser._id,
		}
	);
	const plan = await upsertDemo(
		LessonPlan,
		{ chapter: chapter._id, topic: "Solving one-variable equations" },
		{
			chapter: chapter._id,
			order: 1,
			topic: "Solving one-variable equations",
			subTopics: ["Balancing", "Checking solutions"],
			objectives: "Students will solve one-variable linear equations.",
			activities: "Board examples, pair practice, exit ticket.",
			resources: ["Textbook ch.2", "Worksheet 1"],
			assessment: "Exit ticket of 3 questions.",
			status: "in-progress",
			progress: 40,
			startDate: addDays(new Date(), -10),
			createdBy: ctx.adminUser._id,
			createdByTeacher: ctx.teachers.math._id,
			updatedBy: ctx.adminUser._id,
			tags: ["math", "demo"],
		}
	);
	const pubChapter = await upsertDemo(
		PublishedChapter,
		{ chapter: chapter._id, gender: "male", section: ctx.sections.A._id },
		{
			chapter: chapter._id,
			academicYear: ctx.academicYear._id,
			grade: g8._id,
			gender: "male",
			section: ctx.sections.A._id,
			subject: math._id,
			publishedBy: ctx.adminUser._id,
			status: "active",
		}
	);
	await upsertDemo(
		LessonPlanProgress,
		{ lessonPlan: plan._id, publishedChapter: pubChapter._id },
		{
			lessonPlan: plan._id,
			publishedChapter: pubChapter._id,
			progress: 40,
			status: "in-progress",
			notes: "Completed balancing examples.",
			updatedBy: ctx.adminUser._id,
		}
	);

	console.log("→ Information / event gallery");
	await upsertDemo(Information, { title: "Demo: Term 1 Parent Meeting" }, {
		title: "Demo: Term 1 Parent Meeting",
		description: "Parents are invited to the hall on Friday at 4:00 PM for a short briefing on Term 1 assessments.",
		category: "Information Desk",
		publishTo: "Both Teachers and Students",
		studentTargeting: {
			academicYear: ctx.yearName,
			targetType: "All Students",
			gender: "Both",
		},
		status: "Published",
		priority: "High",
		tags: ["parents", "demo"],
		publishedAt: addDays(new Date(), -1),
		createdBy: ctx.adminUser._id,
		updatedBy: ctx.adminUser._id,
	});
	await upsertDemo(Information, { title: "Demo: Lab Safety Reminder (draft)" }, {
		title: "Demo: Lab Safety Reminder (draft)",
		description: "Draft notice about lab coats and goggles.",
		category: "Help Desk",
		publishTo: "All Students",
		status: "Draft",
		priority: "Medium",
		tags: ["science", "demo"],
		createdBy: ctx.adminUser._id,
		updatedBy: ctx.adminUser._id,
	});

	await upsertDemo(EventGallery, { eventName: "Demo Sports Day" }, {
		eventName: "Demo Sports Day",
		description: "Track and field finals. Placeholder gallery — no binary images stored.",
		eventDate: addDays(new Date(), -4),
		status: "Published",
		publishOption: "Publish Now",
		publishTo: "Both Teachers and Students",
		studentTargeting: { academicYear: ctx.yearName, targetType: "All Students", gender: "Both" },
		images: [
			{
				url: "https://placehold.co/800x500?text=Demo+Sports+Day",
				s3Key: "demo/event-gallery/sports-day.jpg",
			},
		],
		createdBy: ctx.adminUser._id,
		updatedBy: ctx.adminUser._id,
	});
	await upsertDemo(EventGallery, { eventName: "Demo Science Fair (draft)" }, {
		eventName: "Demo Science Fair (draft)",
		description: "Upcoming science fair — draft event.",
		eventDate: addDays(new Date(), 21),
		status: "Draft",
		publishOption: "Publish Later",
		scheduledPublishDate: addDays(new Date(), 14),
		createdBy: ctx.adminUser._id,
		updatedBy: ctx.adminUser._id,
	});
}

async function seedAccounting(ctx) {
	console.log("→ Accounting");
	const tuition = await upsertDemo(AccountingFeeType, { name: "Demo Tuition Fee" }, {
		name: "Demo Tuition Fee",
		description: "Term tuition",
		defaultAmount: 15000,
		isActive: true,
	});
	const transport = await upsertDemo(AccountingFeeType, { name: "Demo Transport Fee" }, {
		name: "Demo Transport Fee",
		description: "School bus",
		defaultAmount: 2500,
		isActive: true,
	});

	const aisha = ctx.students[0];
	const omar = ctx.students[1];
	if (aisha) {
		const fee = await upsertDemo(
			StudentFee,
			{ student: aisha._id, feeType: tuition._id, academicYear: ctx.yearName, term: ctx.term },
			{
				student: aisha._id,
				feeType: tuition._id,
				academicYear: ctx.yearName,
				term: ctx.term,
				amountDue: 15000,
				paidAmount: 15000,
				status: "paid",
				dueDate: addDays(new Date(), -20),
				notes: "Demo full payment",
				lastPaymentAt: addDays(new Date(), -18),
				payments: [
					{
						amount: 15000,
						paymentDate: addDays(new Date(), -18),
						paymentMethod: "bank_transfer",
						referenceNumber: "DEMO-FEE-001",
						notes: "Term 1 tuition",
					},
				],
			}
		);
		await upsertDemo(
			AccountTransaction,
			{ referenceNumber: "DEMO-TXN-FEE-001" },
			{
				transactionType: "FEE_PAYMENT",
				direction: "credit",
				amount: 15000,
				transactionDate: addDays(new Date(), -18),
				paymentMethod: "bank_transfer",
				referenceNumber: "DEMO-TXN-FEE-001",
				narration: "Demo tuition — Aisha Rahman",
				studentFee: fee._id,
				createdBy: ctx.adminUser._id,
			}
		);
	}
	if (omar) {
		await upsertDemo(
			StudentFee,
			{ student: omar._id, feeType: transport._id, academicYear: ctx.yearName, term: ctx.term },
			{
				student: omar._id,
				feeType: transport._id,
				academicYear: ctx.yearName,
				term: ctx.term,
				amountDue: 2500,
				paidAmount: 1000,
				status: "partially_paid",
				dueDate: addDays(new Date(), 10),
				notes: "Demo partial payment",
				lastPaymentAt: addDays(new Date(), -5),
				payments: [
					{
						amount: 1000,
						paymentDate: addDays(new Date(), -5),
						paymentMethod: "cash",
						referenceNumber: "DEMO-FEE-002",
					},
				],
			}
		);
	}

	const basic = await upsertDemo(SalaryType, { name: "Demo Basic Pay" }, {
		name: "Demo Basic Pay",
		description: "Monthly basic",
		defaultAmount: 25000,
		isRecurring: true,
		isActive: true,
	});
	const allowance = await upsertDemo(SalaryType, { name: "Demo Housing Allowance" }, {
		name: "Demo Housing Allowance",
		description: "Housing",
		defaultAmount: 5000,
		isRecurring: true,
		isActive: true,
	});
	const now = new Date();
	const salary = await upsertDemo(
		TeacherSalary,
		{ teacher: ctx.teachers.math._id, payrollMonth: now.getMonth() + 1, payrollYear: now.getFullYear() },
		{
			teacher: ctx.teachers.math._id,
			payrollMonth: now.getMonth() + 1,
			payrollYear: now.getFullYear(),
			totalAmount: 30000,
			paidAmount: 30000,
			components: [
				{ salaryType: basic._id, amount: 25000 },
				{ salaryType: allowance._id, amount: 5000 },
			],
			status: "paid",
			paymentDate: addDays(new Date(), -3),
			paymentMethod: "bank_transfer",
			referenceNumber: "DEMO-SALARY-01",
			notes: "Demo payroll",
		}
	);
	await upsertDemo(AccountTransaction, { referenceNumber: "DEMO-TXN-SAL-001" }, {
		transactionType: "SALARY_PAYMENT",
		direction: "debit",
		amount: 30000,
		transactionDate: addDays(new Date(), -3),
		paymentMethod: "bank_transfer",
		referenceNumber: "DEMO-TXN-SAL-001",
		narration: "Demo salary — Priya Nair",
		teacherSalary: salary._id,
		createdBy: ctx.adminUser._id,
	});

	const utilities = await upsertDemo(ExpenseHead, { name: "Demo Utilities" }, {
		name: "Demo Utilities",
		description: "Electricity and water",
		isActive: true,
	});
	const expense = await upsertDemo(Expense, { referenceNumber: "DEMO-EXP-001" }, {
		expenseHead: utilities._id,
		amount: 4200,
		expenseDate: addDays(new Date(), -8),
		paidTo: "City Power Co.",
		paymentMethod: "bank_transfer",
		status: "paid",
		referenceNumber: "DEMO-EXP-001",
		notes: "Demo electricity bill",
		recordedBy: ctx.adminUser._id,
	});
	await upsertDemo(AccountTransaction, { referenceNumber: "DEMO-TXN-EXP-001" }, {
		transactionType: "EXPENSE_PAYMENT",
		direction: "debit",
		amount: 4200,
		transactionDate: addDays(new Date(), -8),
		paymentMethod: "bank_transfer",
		referenceNumber: "DEMO-TXN-EXP-001",
		narration: "Demo utilities",
		expense: expense._id,
		createdBy: ctx.adminUser._id,
	});
}

async function seedFeedback(ctx) {
	console.log("→ Feedback");
	const student = ctx.students[1];
	const academic = ctx.academicStudents.find(
		(a) => String(a.studentId) === String(student._id)
	);
	if (!student || !academic) return;

	await upsertDemo(
		ClassFeedback,
		{ studentId: student._id, type: "feedback", feedback: "Participates well in class discussions." },
		{
			academicYear: ctx.academicYear._id,
			grade: student.grade,
			gender: student.gender,
			section: student.section,
			academicStudentId: academic._id,
			studentId: student._id,
			type: "feedback",
			feedbackDate: addDays(new Date(), -3),
			feedback: "Participates well in class discussions.",
			createdBy: ctx.adminUser._id,
			updatedBy: ctx.adminUser._id,
		}
	);
	await upsertDemo(
		ClassFeedback,
		{ studentId: student._id, type: "discipline", feedback: "Late to first period on Tuesday — reminder issued." },
		{
			academicYear: ctx.academicYear._id,
			grade: student.grade,
			gender: student.gender,
			section: student.section,
			academicStudentId: academic._id,
			studentId: student._id,
			type: "discipline",
			feedbackDate: addDays(new Date(), -2),
			feedback: "Late to first period on Tuesday — reminder issued.",
			createdBy: ctx.adminUser._id,
			updatedBy: ctx.adminUser._id,
		}
	);
	await upsertDemo(
		SubjectFeedback,
		{
			studentId: student._id,
			subject: ctx.subjects.Mathematics._id,
			feedback: "Strong algebra skills; keep practising word problems.",
		},
		{
			academicYear: ctx.academicYear._id,
			academicStudentId: academic._id,
			studentId: student._id,
			grade: student.grade,
			gender: student.gender,
			section: student.section,
			subject: ctx.subjects.Mathematics._id,
			type: "feedback",
			feedbackDate: addDays(new Date(), -1),
			feedback: "Strong algebra skills; keep practising word problems.",
			createdBy: ctx.adminUser._id,
			updatedBy: ctx.adminUser._id,
		}
	);
}

async function step(name, fn) {
	try {
		await fn();
	} catch (err) {
		err.message = `[${name}] ${err.message}`;
		throw err;
	}
}

async function seedAll(ctx) {
	await step("users", () => seedAdminAndStaff(ctx));
	await step("roles", () => seedRoles(ctx));
	await step("academic setup", () => seedAcademicSetup(ctx));
	await step("people", () => seedPeople(ctx));
	await step("curriculum", () => seedCurriculum(ctx));
	await step("timetable", () => seedTimetable(ctx));
	await step("attendance", () => seedAttendance(ctx));
	await step("assignments/exams", () => seedAssignmentsAndExams(ctx));
	await step("library", () => seedLibrary(ctx));
	await step("inventory", () => seedInventory(ctx));
	await step("content", () => seedContent(ctx));
	await step("accounting", () => seedAccounting(ctx));
	await step("feedback", () => seedFeedback(ctx));
	return ctx;
}

module.exports = {
	seedAll,
	DEMO_PASSWORD,
	TEACHER_DEFS,
	STUDENT_DEFS,
};
