const express = require('express');
const teacherController = require('../../controllers/users/teacherController');
const classFeedbackRoutes = require('./classFeedbackRoutes');
const subjectFeedbackRoutes = require('./subjectFeedbackRoutes');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const checkPermission = require('../../middlewares/checkPermission');

const router = express.Router();

// Apply the protect middleware to all routes
router.use(authMiddlewares.protect);

// Class feedback (no extra permission gating; uses class-teacher assignment checks)
router.use(classFeedbackRoutes);
// Subject feedback
router.use(subjectFeedbackRoutes);

router
    .route('/')
    .get(checkPermission("Read", "Teacher"), teacherController.getTeachers)
    .post(checkPermission("Create", "Teacher"), teacherController.createTeacher);

router.get('/dashboard', checkPermission("Read", "TeacherDashboard"), teacherController.getTeacherDashboardStats);
router.get('/dashboard/me', checkPermission("Read", "TeacherSelfDashboard"), teacherController.getMyTeacherDashboardStats);
router.get('/timetable/me', checkPermission("Read", "Timetable"), teacherController.getMyTeacherTimetable);
router.get('/subject-notes/me', checkPermission("Read", "SubjectNotes"), teacherController.getMyTeacherSubjectNotes);
router.get('/information/me', checkPermission("Read", "Information"), teacherController.getMyTeacherInformation);
router.get('/information/category/:category', checkPermission("Read", "Information"), teacherController.getMyTeacherInformationByCategory);
router.get('/information/categories/overview', checkPermission("Read", "Information"), teacherController.getMyTeacherInformationCategories);
router.get('/information/:id', checkPermission("Read", "Information"), teacherController.getMyTeacherInformationById);
router.get('/attendance/me', checkPermission("Read", "TeacherAttendance"), teacherController.getMyTeacherAttendance);
router.post('/attendance/me/mark', checkPermission("Create", "TeacherAttendance"), teacherController.markMyTeacherAttendance);
router.get('/attendance/classes', checkPermission("Read", "TeacherAttendance"), teacherController.getMyTeacherClasses);
router.get('/attendance/students', checkPermission("Read", "Attendance"), teacherController.getMyTeacherStudentsForAttendance);
router.post('/attendance/students/mark', checkPermission("Create", "Attendance"), teacherController.markMyTeacherStudentAttendance);
router.get('/attendance/students/report', checkPermission("Read", "AttendanceReports"), teacherController.getMyTeacherStudentAttendanceReport);
router.get('/assignments/published/me', checkPermission("Read", "PublishedAssignments"), teacherController.getMyTeacherPublishedAssignments);
router.get('/assignments/published/:publishId', checkPermission("Read", "PublishedAssignments"), teacherController.getMyTeacherPublishedAssignmentDetails);
router.get('/assignments/published/:publishId/students', checkPermission("Read", "PublishedAssignments"), teacherController.getMyTeacherPublishedAssignmentStudents);
router.put('/assignments/student-attempt/:attemptId/remarks', checkPermission("Edit", "Assignments"), teacherController.updateMyTeacherStudentAssignmentRemarks);
router.get('/assignments/me', checkPermission("Read", "Assignments"), teacherController.getMyTeacherAssignments);
router.post('/assignments', checkPermission("Create", "Assignments"), teacherController.createMyTeacherAssignment);
router.get('/assignments/:id', checkPermission("Read", "Assignments"), teacherController.getMyTeacherAssignmentById);
router.put('/assignments/:id', checkPermission("Edit", "Assignments"), teacherController.updateMyTeacherAssignment);
router.delete('/assignments/:id', checkPermission("Delete", "Assignments"), teacherController.deleteMyTeacherAssignment);
router.post('/assignments/:id/publish', checkPermission("Publish", "Assignments"), teacherController.publishMyTeacherAssignment);
router.delete('/assignments/published/:publishId', checkPermission("Delete", "PublishedAssignments"), teacherController.deleteMyTeacherPublishedAssignment);
router.get('/assignments/:id/getNotPublishedSections', checkPermission("Read", "Assignments"), teacherController.getMyTeacherNotPublishedSections);
router.get('/academic-years', checkPermission("Read", "Academic"), teacherController.getMyTeacherAcademicYears);
router.get('/grades', checkPermission("Read", "Grade"), teacherController.getMyTeacherGrades);
router.get('/subjects',  teacherController.getMyTeacherSubjects);
router.get('/exams/me', checkPermission("Read", "Exams"), teacherController.getMyTeacherExams);
router.post('/exams', checkPermission("Create", "Exams"), teacherController.createMyTeacherExam);
router.get('/exams/:id', checkPermission("Read", "Exams"), teacherController.getMyTeacherExamById);
router.put('/exams/:id', checkPermission("Edit", "Exams"), teacherController.updateMyTeacherExam);
router.delete('/exams/:id', checkPermission("Delete", "Exams"), teacherController.deleteMyTeacherExam);
router.get('/exams/published/me', checkPermission("Read", "PublishedExams"), teacherController.getMyTeacherPublishedExams);
router.get('/exams/published/:publishId', checkPermission("Read", "PublishedExams"), teacherController.getMyTeacherPublishedExamDetails);
router.post('/exams/:id/publish', checkPermission("Create", "PublishedExams"), teacherController.publishMyTeacherExam);
router.delete('/exams/published/:publishId', checkPermission("Delete", "PublishedExams"), teacherController.deleteMyTeacherPublishedExam);
router.get('/exams/:id/getNotPublishedSections', checkPermission("Read", "Exams"), teacherController.getMyTeacherNotPublishedExamSections);
router.get('/exams/published/:publishId/students', checkPermission("Read", "PublishedExams"), teacherController.getMyTeacherPublishedExamStudents);
router.get('/question-banks', checkPermission("Read", "QuestionBank"), teacherController.getMyTeacherQuestionBanks);

router
    .route('/:id')
    .get(checkPermission("Read", "Teacher"), teacherController.getTeacherById)
    .patch(checkPermission("Edit", "Teacher"), teacherController.updateTeacher)
    .delete(checkPermission("Delete", "Teacher"), teacherController.deleteTeacher);



module.exports = router;
