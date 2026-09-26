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

const DEMO_MODELS = [
	StudentExamAttempt,
	StudentPerformance,
	StudentAssignmentAttempt,
	Publish,
	PublishAssignment,
	Question,
	QuestionBank,
	OnlineExam,
	Assignment,
	StudentMarks,
	Category,
	SubCategory,
	Exam,
	Attendance,
	BookIssue,
	Book,
	BookCatalog,
	BookCategory,
	Rack,
	Sale,
	Purchase,
	Stock,
	Product,
	InventorySubCategory,
	InventoryCategory,
	Unit,
	Store,
	AccountTransaction,
	StudentFee,
	TeacherSalary,
	Expense,
	ExpenseHead,
	SalaryType,
	AccountingFeeType,
	Comment,
	Post,
	SubjectFeedback,
	ClassFeedback,
	PublishedSubjectNotes,
	SubjectNotes,
	LessonPlanProgress,
	LessonPlan,
	PublishedChapter,
	Chapter,
	Information,
	EventGallery,
	StudentSubject,
	AcademicStudent,
	SectionHistory,
	GradeSubject,
	GroupSubject,
	ClassTeacher,
	GradePermission,
	SubjectPermission,
	Timetable,
	TermHistory,
	Student,
	Teacher,
	Settings,
	Grade,
	Section,
	Subject,
	Religion,
	Roles,
	AcademicYear,
	User,
];

async function wipeDemo({ adminEmail }) {
	console.log("Wiping demo-tagged documents only (isDemo: true / demo- prefixes)...");
	let total = 0;

	for (const Model of DEMO_MODELS) {
		const res = await Model.deleteMany({ isDemo: true });
		if (res.deletedCount) {
			console.log(`  ${Model.modelName}: ${res.deletedCount}`);
			total += res.deletedCount;
		}
	}

	const userRes = await User.deleteMany({
		$and: [
			{ email: /^demo-/i },
			{ email: { $ne: String(adminEmail || "").toLowerCase() } },
		],
	});
	if (userRes.deletedCount) {
		console.log(`  User (demo- email): ${userRes.deletedCount}`);
		total += userRes.deletedCount;
	}

	const teacherRes = await Teacher.deleteMany({
		$or: [{ email: /^demo-/i }, { employeeId: /^DEMO-/i }],
	});
	if (teacherRes.deletedCount) {
		console.log(`  Teacher (demo- prefix): ${teacherRes.deletedCount}`);
		total += teacherRes.deletedCount;
	}

	const studentRes = await Student.deleteMany({
		$or: [{ studentID: /^DEMO-/i }, { Email: /^demo-/i }],
	});
	if (studentRes.deletedCount) {
		console.log(`  Student (DEMO- prefix): ${studentRes.deletedCount}`);
		total += studentRes.deletedCount;
	}

	console.log(`Demo wipe complete. Removed ${total} documents.`);
	console.log("Shared/reused records (untagged grades, countries, real admin) were left intact.");
}

module.exports = { wipeDemo, DEMO_MODELS };
