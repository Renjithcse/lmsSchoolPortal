import { createBrowserRouter } from "react-router-dom";
import LoginScreen from "../screens/auth/LoginScreen";
import { Suspense, lazy } from "react";
import CustomLoader from "../components/Common/CustomLoader";
import ProtectedRouter from "./protectedRoutes";
import AcademicScreen from '../screens/admin/academic';
import TermHistoryScreen from '../screens/admin/termHistory';
import GradeScreen from '../screens/admin/grade';
import SubjectScreen from '../screens/admin/subject';
import SubjectNotesScreen from '../screens/admin/subjectNotes';
import CreateSubjectNotesScreen from '../screens/admin/subjectNotes/CreateSubjectNotesScreen';
import EditSubjectNotesScreen from '../screens/admin/subjectNotes/EditSubjectNotesScreen';
import PublishSubjectNotesScreen from '../screens/admin/subjectNotes/PublishSubjectNotesScreen';
import LessonPlansScreen from '../screens/admin/lessonPlans';
import CreateChapterScreen from '../screens/admin/lessonPlans/CreateChapterScreen';
import EditChapterScreen from '../screens/admin/lessonPlans/EditChapterScreen';
import PublishChapterScreen from '../screens/admin/lessonPlans/PublishChapterScreen';
import ChapterLessonPlansScreen from '../screens/admin/lessonPlans/ChapterLessonPlansScreen';
import CreateLessonPlanScreen from '../screens/admin/lessonPlans/CreateLessonPlanScreen';
import EditLessonPlanScreen from '../screens/admin/lessonPlans/EditLessonPlanScreen';
import InformationScreen from '../screens/admin/information';
import CreateInformationScreen from '../screens/admin/information/CreateInformationScreen';
import EditInformationScreen from '../screens/admin/information/EditInformationScreen';
import ViewInformationScreen from '../screens/admin/information/ViewInformationScreen';
import EventGalleryList from '../screens/admin/eventGallery/EventGalleryList';
import EventGalleryForm from '../screens/admin/eventGallery/EventGalleryForm';
import EventGalleryView from '../screens/admin/eventGallery/EventGalleryView';
import EventGalleryPublish from '../screens/admin/eventGallery/EventGalleryPublish';
import StudentInformation from '../screens/StudentsScreen/StudentInformation';
import StudentInformationCategory from '../screens/StudentsScreen/StudentInformationCategory';
import ViewStudentInformation from '../screens/StudentsScreen/ViewStudentInformation';
import NationalityScreen from '../screens/admin/nationality';
import CityScreen from '../screens/admin/city';
import DesignationScreen from '../screens/admin/Designation';
import SectionScreen from "../screens/admin/section";
import TeacherModule from "../screens/admin/teacher";
import TeacherDashboard from "../screens/admin/teacher/TeacherDashboard";
import TeacherList from "../screens/admin/teacher/TeacherList";
import TeacherSelfDashboard from "../screens/admin/teacher/TeacherSelfDashboard";
import Dashboard from "../screens/Dashboard";
import ExamMark from "../screens/ExamMark";
import ExamMarkDashboard from "../screens/ExamMark/ExamMarkDashboard";
import OnlineExamScreen from "../screens/onlineExam";
import Exams from "../screens/onlineExam/Exams";
import ViewExam from "../screens/onlineExam/ViewExam";
import PublishedExams from "../screens/onlineExam/PublishedExams";
import Questions from "../screens/onlineExam/Questions";
import QuestionBanks from "../screens/onlineExam/QuestionBanks";
import ReligionScreen from "../screens/admin/religion";
import TeacherForm from "../components/admin/teacher/Teacherform";
import NewQuestion from "../components/OnlineExam/NewQuestion";
import SinglePublished from "../screens/onlineExam/SinglePublished";
import CreateRetest from "../screens/onlineExam/CreateRetest";
import AssignmentScreen from "../screens/assignments";
import AssignmentsDashboard from "../screens/assignments/AssignmentsDashboard";
import AssignmentLists from "../screens/assignments/AssignmentLists";
import NewAssignment from "../components/assignments/NewAssignment";
import ViewAssignment from "../screens/assignments/ViewAssignment";
import ViewPublished from "../screens/assignments/ViewPublished";
import Exam from "../screens/ExamMark/Exam";
import Category from "../screens/ExamMark/Category";
import MarkEntry from "../screens/ExamMark/MarkEntry";
import NewCategory from "../screens/ExamMark/NewCategory";
import EditMark from "../screens/ExamMark/EditMark";
import Roles from "../screens/admin/Roles";
import NewRoles from "../screens/admin/Roles/NewRoles";
import EditRoles from "../screens/admin/Roles/EditRoles";
import TeacherRegister from "../screens/auth/TeacherRegister";
import TeacherPassword from "../screens/auth/TeacherPassword";
import TeacherProfile from "../screens/auth/TeacherProfile";
import ForgotPassword from "../screens/auth/ForgotPassword";
import ResetPassword from "../screens/auth/ResetPassword";
import EmailVerificationScreen from "../screens/auth/EmailVerificationScreen";
import GradeSubject from "../screens/admin/Subjects/GradeSubject";
import SubjectLists from "../screens/admin/Subjects/GradeSubject/SubjectLists";
import GroupSubjects from "../screens/admin/Subjects/GroupSubject";
import GroupSubjectLists from "../screens/admin/Subjects/GroupSubject/SubjectLists";
import SubjectStudent from "../screens/admin/Subjects/SubjectStudent";
import AllocatedStudents from "../screens/admin/Subjects/SubjectStudent/AllocatedStudents";
import ViewTeachers from "../screens/admin/teacher/ViewTeachers";
import Settings from "../screens/Settings";
import StudentsModule from "../screens/Students";
import StudentsDashboard from "../screens/Students/StudentsDashboard";
import ListStudents from "../screens/Students/ListStudents";
import NewStudent from "../screens/Students/NewStudent";
import EditStudent from "../screens/Students/EditStudent";
import StudentProfile from "../screens/Students/StudentProfile";
import StudentRegister from "../screens/auth/StudentRegister";
import StudentPassword from "../screens/auth/StudentPassword";
import StudentDashboard from "../screens/StudentsScreen/Dashboard";
import StudentTimetable from "../screens/StudentsScreen/StudentTimetable";
import StudentSubjectNotes from "../screens/StudentsScreen/StudentSubjectNotes";
import StudentAttendance from "../screens/StudentsScreen/StudentAttendance";
import StudentLessonPlans from "../screens/StudentsScreen/StudentLessonPlans";
import StudentLessonPlanSubject from "../screens/StudentsScreen/StudentLessonPlanSubject";
import StudentOnlineExam from "../screens/StudentsScreen/OnlineExam";
import StudentOnlineAssignment from "../screens/StudentsScreen/OnlineAssignment";
import AssignmentDashboard from "../screens/StudentsScreen/OnlineAssignment/Dashboard";
import SubjectAssignments from "../screens/StudentsScreen/OnlineAssignment/SubjectAssignments";
import StudentViewAssignment from "../screens/StudentsScreen/OnlineAssignment/ViewAssignment";
import StudentSubmitAssignment from "../screens/StudentsScreen/OnlineAssignment/SubmitAssignment";
import OnlineExamDashboard from "../screens/StudentsScreen/OnlineExam/Dashboard";
import AdminOnlineExamDashboard from "../screens/onlineExam/OnlineExamDashboard";
import OnlineExamHistory from "../screens/StudentsScreen/OnlineExam/ExamHistory";
import OnlineExamResults from "../screens/StudentsScreen/OnlineExam/ExamResults";
import OnlineSubjectExam from "../screens/StudentsScreen/OnlineExam/SubjectExams";
import OnlineTakeExam from "../screens/StudentsScreen/OnlineExam/TakeExam";
import DetailedExamResults from "../screens/StudentsScreen/OnlineExam/DetailedExamResults";
import StudentMarks from "../screens/StudentsScreen/MarkDetails";
import ExamWiseSubjects from "../screens/StudentsScreen/MarkDetails/ExamWiseSubjects";
import SubjectDetails from "../screens/StudentsScreen/MarkDetails/SubjectDetails";
import StudentBlogView from "../screens/StudentsScreen/BlogView";
import StudentLibraryView from "../screens/StudentsScreen/LibraryView";
import StudentFeedback from "../screens/StudentsScreen/StudentFeedback";
import StudentDiscipline from "../screens/StudentsScreen/StudentDiscipline";
import EventGalleryViewStudents from "../screens/StudentsScreen/EventGalleryViewStudents";
import EventGalleryDetailStudents from "../screens/StudentsScreen/EventGalleryDetailStudents";
import ExamReport from "../screens/onlineExam/ExamReport";
import AttendanceDashboard from "../screens/Attendance/AttendanceDashboard";
import AttendanceReportsScreen from "../screens/Attendance/AttendanceReportsScreen";
import AttendanceTabScreen from "../screens/Attendance/AttendanceTabScreen";
import ClassFeedback from "../screens/feedback/ClassFeedback";
import ClassFeedbackList from "../screens/feedback/ClassFeedbackList";
import SubjectFeedback from "../screens/feedback/SubjectFeedback";
import SubjectFeedbackList from "../screens/feedback/SubjectFeedbackList";
import InventoryDashboard from "../screens/inventory/Dashboard";
import Products from "../screens/inventory/Products";
import AddProductScreen from "../screens/inventory/AddProductScreen";
import ViewProductScreen from "../screens/inventory/ViewProductScreen";
import PurchaseTableView from "../screens/inventory/PurchaseTableView";
import AddPurchasePage from "../screens/inventory/AddPurchasePage";
import CategoryTable from "../screens/inventory/CategoryTable";
import SubCategoryTable from "../screens/inventory/SubCategoryTable";
import UnitPage from "../screens/inventory/UnitPage";
import StorePage from "../screens/inventory/StorePage";
import SalesPage from "../screens/inventory/SalesPage";
import AddSalesPage from "../screens/inventory/AddSalesPage";
import EditProductScreen from "../screens/inventory/EditProductScreen";
import ViewPurchasePage from "../screens/inventory/ViewPurchasePage";
import EditPurchasePage from "../screens/inventory/EditPurchasePage";
import ViewSalesPage from "../screens/inventory/ViewSalesPage";
import InvoicePage from "../screens/inventory/InvoicePage";
import InventoryReport from "../screens/inventory/InventoryReport";
import UserProfile from "../screens/UserProfile";
import ExamHistory from "../screens/StudentsScreen/OnlineExam/ExamHistory";

// Library imports
import LibraryDashboard from "../screens/library";
import CategoryScreen from "../screens/library/CategoryScreen";
import BookCatalogScreen from "../screens/library/BookCatalogScreen";
import RackScreen from "../screens/library/RackScreen";
import BookScreen from "../screens/library/BookScreen";
import BookIssueScreen from "../screens/library/BookIssueScreen";
import TeachersBooksScreen from "../screens/library/TeachersBooksScreen";

// Blog imports
import BlogDashboard from "../screens/blog";
import PostScreen from "../screens/blog/PostScreen";
import CommentScreen from "../screens/blog/CommentScreen";
import BlogViewScreen from "../screens/blog/BlogViewScreen";
import SettingsScreen from "../screens/admin/settings";
import TimetableScreen from "../screens/admin/timetable";
import CreateTimetableScreen from "../screens/admin/timetable/CreateTimetableScreen";
import EditTimetableScreen from "../screens/admin/timetable/EditTimetableScreen";




const LoginLayout = lazy(() => import('../components/LoginLayout'));
const DashBoardLayout = lazy(() => import('../components/DashboardLayout'));


export const RouterPath = createBrowserRouter([
    {
        path: "/login",
        element: <Suspense fallback={<CustomLoader text="Loading..." />}><LoginLayout /></Suspense>,
        children: [
            {
                index: true,
                element: <LoginScreen />,
            },
        ],
    },
    {
        path: "/invoice/:id",
        element: <InvoicePage />,
    },
    {
        path: "/blog-view",
        element: <BlogViewScreen />,
    },
    {
        path: "/signup-teacher",
        element: <Suspense fallback={<CustomLoader text="Loading..." />}><LoginLayout /></Suspense>,
        children: [
            {
                index: true,
                element: <TeacherRegister />,
            },
        ],
    },
    {
        path: "/signup-student",
        element: <Suspense fallback={<CustomLoader text="Loading..." />}><LoginLayout /></Suspense>,
        children: [
            {
                index: true,
                element: <StudentRegister />,
            },
        ],
    },
    {
        path: "/student-password",
        element: <Suspense fallback={<CustomLoader text="Loading..." />}><LoginLayout /></Suspense>,
        children: [
            {
                index: true,
                element: <StudentPassword />,
            },
        ],
    },
    {
        path: "/teacher-profile",
        element: <Suspense fallback={<CustomLoader text="Loading..." />}><LoginLayout /></Suspense>,
        children: [
            {
                index: true,
                element: <TeacherProfile />,
            },
        ],
    },
    {
        path: "/teacher-password",
        element: <Suspense fallback={<CustomLoader text="Loading..." />}><LoginLayout /></Suspense>,
        children: [
            {
                index: true,
                element: <TeacherPassword />,
            },
        ],
    },
    {
        path: "/forgot-password",
        element: <Suspense fallback={<CustomLoader text="Loading..." />}><LoginLayout /></Suspense>,
        children: [
            {
                index: true,
                element: <ForgotPassword />,
            },
        ],
    },
    {
        path: "/reset-password",
        element: <Suspense fallback={<CustomLoader text="Loading..." />}><LoginLayout /></Suspense>,
        children: [
            {
                index: true,
                element: <ResetPassword />,
            },
        ],
    },
    {
        path: "/",
        element: <Suspense fallback={<CustomLoader text="Loading..." />}>
            <DashBoardLayout>
                <ProtectedRouter />
            </DashBoardLayout>
            {/* </ProtectedRouter> */}
        </Suspense>,
        children: [
            {
                index: true,
                element: <Dashboard />,
                handle: { subject: "Dashboard", action: "Read" }
            },
            {
                path: "academic",
                element: <AcademicScreen />,
                handle: { subject: "Academic", action: "Read" }
            },
            {
                path: "term-history",
                element: <TermHistoryScreen />,
                handle: { subject: "TermHistory", action: "Read" }
            },
            {
                path: "/settings",
                element: <SettingsScreen />,
                handle: { subject: "Settings", action: "Read" }
            },
            {
                path: "/timetable",
                handle: { subject: "Timetable", action: "Read" },
                children: [
                    {
                        index: true,
                        element: <TimetableScreen />,
                        handle: { subject: "Timetable", action: "Read" },
                    },
                    {
                        path: "create",
                        element: <CreateTimetableScreen />,
                        handle: { subject: "Timetable", action: "Create" },
                    },
                    {
                        path: "edit/:id",
                        element: <EditTimetableScreen />,
                        handle: { subject: "Timetable", action: "Edit" },
                    }
                ]
            },
            {
                path: "/subject-notes",
                handle: { subject: "SubjectNotes", action: "Read" },
                children: [
                    {
                        index: true,
                        element: <SubjectNotesScreen />,
                        handle: { subject: "SubjectNotes", action: "Read" },
                    },
                    {
                        path: "create",
                        element: <CreateSubjectNotesScreen />,
                        handle: { subject: "SubjectNotes", action: "Create" },
                    },
                    {
                        path: "edit/:id",
                        element: <EditSubjectNotesScreen />,
                        handle: { subject: "SubjectNotes", action: "Edit" },
                    },
                    {
                        path: "publish/:id",
                        element: <PublishSubjectNotesScreen />,
                        handle: { subject: "SubjectNotes", action: "Edit" },
                    }
                ]
            },
            {
                path: "/lesson-plans",
                handle: { subject: "LessonPlans", action: "Read" },
                children: [
                    {
                        index: true,
                        element: <LessonPlansScreen />,
                        handle: { subject: "LessonPlans", action: "Read" },
                    },
                    {
                        path: "create",
                        element: <CreateChapterScreen />,
                        handle: { subject: "LessonPlans", action: "Create" },
                    },
                    {
                        path: "edit/:id",
                        element: <EditChapterScreen />,
                        handle: { subject: "LessonPlans", action: "Edit" },
                    },
                    {
                        path: "publish/:id",
                        element: <PublishChapterScreen />,
                        handle: { subject: "PublishedLessonPlans", action: "Read" },
                    },
                    {
                        path: "chapter/:chapterId/lesson-plans",
                        element: <ChapterLessonPlansScreen />,
                        handle: { subject: "LessonPlans", action: "Read" },
                    },
                    {
                        path: "chapter/:chapterId/create",
                        element: <CreateLessonPlanScreen />,
                        handle: { subject: "LessonPlans", action: "Create" },
                    },
                    {
                        path: "chapter/:chapterId/edit/:id",
                        element: <EditLessonPlanScreen />,
                        handle: { subject: "LessonPlans", action: "Edit" },
                    },
                ],
            },
            {
                path: "/information",
                handle: { subject: "Information", action: "Read" },
                children: [
                    {
                        index: true,
                        element: <InformationScreen />,
                        handle: { subject: "Information", action: "Read" },
                    },
                    {
                        path: "create",
                        element: <CreateInformationScreen />,
                        handle: { subject: "Information", action: "Create" },
                    },
                    {
                        path: "edit/:id",
                        element: <EditInformationScreen />,
                        handle: { subject: "Information", action: "Edit" },
                    },
                    {
                        path: "view/:id",
                        element: <ViewInformationScreen />,
                        handle: { subject: "Information", action: "Read" },
                    }
                ]
            },
            {
                path: "event-gallery",
                handle: { subject: "EventGallery", action: "Read" },
                children: [
                    {
                        index: true,
                        element: <EventGalleryList />,
                        handle: { subject: "EventGallery", action: "Read" },
                    },
                    {
                        path: "new",
                        element: <EventGalleryForm />,
                        handle: { subject: "EventGallery", action: "Create" },
                    },
                    {
                        path: "edit/:id",
                        element: <EventGalleryForm />,
                        handle: { subject: "EventGallery", action: "Edit" },
                    },
					{
						path: "view/:id",
						element: <EventGalleryView />,
						handle: { subject: "EventGallery", action: "Read" },
					},
					{
						path: "publish/:id",
						element: <EventGalleryPublish />,
						handle: { subject: "EventGallery", action: "Edit" },
					},
				],
            },
            {
                path: '/grade',
                element: <GradeScreen />,
                handle: { subject: "Grade", action: "Read" }
            },

            {
                path: '/subject',
                element: <SubjectScreen />,
                handle: { subject: "Subject", action: "Read" }

            },
            {
                path: '/nationality',
                element: <NationalityScreen />,
                handle: { subject: "Nationality", action: "Read" }
            },
            {
                path: '/city',
                element: <CityScreen />,
                handle: { subject: "City", action: "Read" }
            },
            {
                path: '/designation',
                element: <DesignationScreen />,
                handle: { subject: "Designation", action: "Read" }
            },
            {
                path: '/grade-subject',
                element: <GradeSubject />,
                handle: { subject: "GradeSubject", action: "Read" },
                children: [
                    {
                        index: true,
                        path: 'list',
                        handle: { subject: "GradeSubject", action: "Read" },
                        element: <SubjectLists />,
                    },

                ],
            },
            {
                path: '/group-subject',
                element: <GroupSubjects />,
                handle: { subject: 'GroupSubject', action: "Read" },
                children: [
                    {
                        index: true,
                        path: 'list',
                        handle: { subject: "GroupSubject", action: "Read" },
                        element: <GroupSubjectLists />,
                    },

                ],
            },
            {
                path: '/subject-student',
                element: <SubjectStudent />,
                handle: { subject: 'SubjectStudent', action: "Read" },
                children: [
                    {
                        index: true,
                        path: 'list',
                        handle: { subject: "SubjectStudent", action: "Read" },
                        element: <AllocatedStudents />,
                    },
                ]
            },
            {
                path: '/section',
                element: <SectionScreen />,
                handle: { subject: 'Section', action: "Read" }
            },
            {
                path: '/exam',
                element: <Exam />,
                handle: { subject: 'Exam', action: "Read" }
            },
            {
                path: '/profile',
                element: <UserProfile />,
            },
            {
                path: '/verify-email',
                element: <EmailVerificationScreen />,
            },
            {
                path: "roles",
                handle: { subject: 'Roles', action: "Read" },
                children: [
                    {
                        index: true,
                        element: <Roles />,
                        handle: { subject: 'Roles', action: "Read"  },
                    },
                    {
                        path: 'add',
                        element: <NewRoles />,
                        handle: { subject: 'Roles', action: "Create" },
                    },
                    {
                        path: 'edit/:id',
                        element: <EditRoles />,
                        handle: { subject: 'Roles', action: "Edit" },
                    }
                ]
            },
            {
                path: '/teacher',
                element: <TeacherModule />,
                handle: { subject: "TeacherDashboard", action: "Read" },
                children: [
                    {
                        index: true,
                        element: <TeacherDashboard />,
                        handle: { subject: "TeacherDashboard", action: "Read" },
                    },
                    {
                        path: 'list',
                        element: <TeacherList />,
                        handle: { subject: "Teacher", action: "Read" },
                    },
                    {
                        path: 'my-dashboard',
                        element: <TeacherSelfDashboard />,
                        handle: { subject: "TeacherSelfDashboard", action: "Read" },
                    },
                    {
                        path: 'view-teacher',
                        element: <ViewTeachers />,
                        handle: { subject: "Teacher", action: "Read" },
                    },
                    {
                        path: 'add',
                        element: <TeacherForm />,
                        handle: { subject: "Teacher", action: "Create" },
                    },
                    {
                        path: 'edit/:id',
                        element: <TeacherForm />,
                        handle: { subject: "Teacher", action: "Edit" },
                    },
                    {
                        path: 'view/:id',
                        element: <TeacherForm />,
                        handle: { subject: "Teacher", action: "Read" },
                    }
                ]
            },
            {
                path: '/student',
                handle: { subject: "StudentDashboard", action: "Read" },
                element: <StudentsModule />,
                children: [
                    {
                        index: true,
                        element: <StudentsDashboard />,
                        handle: { subject: "StudentDashboard", action: "Read" },
                    },
                    {
                        path: 'list',
                        element: <ListStudents />,
                        handle: { subject: "Student", action: "Read" },
                    },
                    {
                        path: 'add',
                        element: <NewStudent />,
                        handle: { subject: "Student", action: "Create" },
                    },
                    {
                        path: 'edit/:id',
                        element: <EditStudent />,
                        handle: { subject: "Student", action: "Edit" },
                    },
                    {
                        path: 'view/:id',
                        element: <StudentProfile />,
                        handle: { subject: "Student", action: "Read" },
                    },
                ]
            },

            {
                path: '/religion',
                element: <ReligionScreen />,
                handle: { subject: "Religion", action: "Read" },
            },
            {
                path: '/online-exam',
                element: <OnlineExamScreen />,
                handle: { subject: "Exams", action: "Read" },
                children: [
                    {
                        index: true,
                        element: <AdminOnlineExamDashboard />,
                        handle: { subject: "Exams", action: "Read" },
                    },
                    {
                        path: 'list',
                        handle: { subject: "Exams", action: "Read" },
                        element: <Exams />,
                    },
                    {
                        path: 'question-bank',
                        children: [
                            {
                                index: true,
                                element: <QuestionBanks />,
                                handle: { subject: "QuestionBank", action: "Read" },
                            },
                            {
                                path: ':id',
                                children: [
                                    {
                                        index: true,
                                        element: <Questions />,
                                        handle: { subject: "QuestionBank", action: "Read" },
                                    },
                                    {
                                        path: 'newquestion',
                                        element: <NewQuestion />,
                                        handle: { subject: "QuestionBank", action: "Create" },
                                    }
                                ]
                            },

                        ]
                    },
                    {
                        path: 'report/:examId',
                        element: <ExamReport />,
                        handle: { subject: "ExamReport", action: "Read" },
                    },
                    {
                        path: ':id',
                        element: <ViewExam />,
                        handle: { subject: "Exams", action: "Read" },
                        children: [
                            {
                                path: 'published',
                                handle: { subject: "PublishedExams", action: "Read" },
                                children: [
                                    {
                                        index: true,
                                        element: <PublishedExams />,
                                        handle: { subject: "PublishedExams", action: "Read" },
                                    },
                                    {
                                        path: ":id",
                                        children: [
                                            {
                                                index: true,
                                                element: <SinglePublished />,
                                                handle: { subject: "PublishedExams", action: "Read" },
                                            },
                                            {
                                                path: "retest",
                                                element: <CreateRetest />,
                                                handle: { subject: "PublishedExams", action: "Create" },
                                            }
                                        ]
                                    }
                                ]
                            },

                            {
                                path: 'questions/:id',
                                element: <Questions />,
                                handle: { subject: "Questions", action: "Read" },
                            },

                        ]

                    }
                ],
            },
            {
                path: "assignments",
                element: <AssignmentScreen />,
                handle: { subject: "Assignments", action: "Read" },
                children: [
                    {
                        index: true,
                        element: <AssignmentsDashboard />,
                        handle: { subject: "Assignments", action: "Read" },
                    },
                    {
                        path: 'list',
                        element: <AssignmentLists />,
                        handle: { subject: "Assignments", action: "Read" },
                    },
                    {
                        path: 'add',
                        element: <NewAssignment />,
                        handle: { subject: "Assignments", action: "Create" },
                    },
                    {
                        path: 'view/:id',
                        element: <ViewAssignment />,
                        handle: { subject: "Assignments", action: "Read" },
                    },
                    {
                        path: 'view/:id/:id',
                        element: <ViewPublished />,
                        handle: { subject: "PublishedAssignments", action: "Read" },
                    }
                ]
            },
            {
                path: '/exammark',
                element: <ExamMark />,
                handle: { subject: 'ExamMark', action: "Read" },
                children: [
                    {
                        index: true,
                        element: <ExamMarkDashboard />,
                        handle: { subject: 'ExamMarkDashboard', action: "Read" },
                    },
                    {
                        path: "category",
                        children: [
                            {
                                index: true,
                                element: <Category />,
                                handle: { subject: 'ExamMark', action: "Read" },

                            },
                            {
                                path: "new",
                                element: <NewCategory />,
                                handle: { subject: 'ExamMark', action: "Create" },

                            }
                        ]
                    },
                    {
                        path: "mark-entry",
                        element: <MarkEntry />,
                        handle: { subject: 'ExamMark', action: "Read" },

                    },
                    {
                        path: "edit-mark",
                        element: <EditMark />,
                        handle: { subject: 'ExamMark', action: "Edit" },

                    }
                ]
            },
            {
                path: "/inventory",
                handle: { subject: "Inventory", action: "Read" },
                children: [
                    {
                        index: true,
                        element: <InventoryDashboard />,
                        handle: { subject: "Inventory", action: "Read" },
                    },
                    {
                        path: "products",
                        handle: { subject: "InventoryProducts", action: "Read" },
                        children: [
                            {
                                index: true,
                                element: <Products />,
                                handle: { subject: "InventoryProducts", action: "Read" },
                            },
                            {
                                path: "add",
                                element: <AddProductScreen />,
                                handle: { subject: "InventoryProducts", action: "Create" },
                            },
                            {
                                path: "view/:id",
                                element: <ViewProductScreen />,
                                handle: { subject: "InventoryProducts", action: "Read" },
                            },
                            {
                                path: "edit/:id",
                                element: <EditProductScreen />,
                                handle: { subject: "InventoryProducts", action: "Edit" },
                            }
                        ]
                    },
                    {
                        path: "purchase",
                        children: [
                            {
                                index: true,
                                element: <PurchaseTableView />,
                                handle: { subject: "InventoryPurchase", action: "Read" },
                            },
                            {
                                path: "add",
                                element: <AddPurchasePage />,
                                handle: { subject: "InventoryPurchase", action: "Create" },
                            },
                            {
                                path: "view/:id",
                                element: <ViewPurchasePage />,
                                handle: { subject: "InventoryPurchase", action: "Read" },
                            },
                            {
                                path: "edit/:id",
                                element: <EditPurchasePage />,
                                handle: { subject: "InventoryPurchase", action: "Edit" },
                            }
                        ]
                    },
                    {
                        path: "category",
                        element: <CategoryTable />,
                        handle: { subject: "InventoryCategory", action: "Read"   },
                    },
                    {
                        path: "sub-category",
                        element: <SubCategoryTable />,
                        handle: { subject: "InventorySubCategory", action: "Read" },
                    },
                    {
                        path: "units",
                        element: <UnitPage />,
                        handle: { subject: "InventoryUnit", action: "Read" },
                    },
                    {
                        path: "store",
                        element: <StorePage />,
                        handle: { subject: "InventoryStore", action: "Read" },
                    },
                    {
                        path: "sales",
                        children: [
                            {
                                index: true,
                                element: <SalesPage />,
                                handle: { subject: "InventorySales", action: "Read" },
                            },
                            {
                                path: "add",
                                element: <AddSalesPage />,
                                handle: { subject: "InventorySales", action: "Create" },
                            },
                            {
                                path: "view/:id",
                                element: <ViewSalesPage />,
                                handle: { subject: "InventorySales", action: "Read" },
                            },
                        ]
                    }, {
                        path: "report",
                        element: <InventoryReport />,
                        handle: { subject: "InventoryReport", action: "Read" },
                    }
                ]
            },
            {
                path: "/library",
                handle: { subject: "Library", action: "Read" },
                children: [
                    {
                        index: true,
                        element: <LibraryDashboard />,
                        handle: { subject: "Library", action: "Read" },
                    },
                    {
                        path: "categories",
                        element: <CategoryScreen />,
                        handle: { subject: "LibraryCategories", action: "Read" },
                    },
                    {
                        path: "catalogs",
                        element: <BookCatalogScreen />,
                        handle: { subject: "LibraryBookCatalog", action: "Read" },
                    },
                    {
                        path: "racks",
                        element: <RackScreen />,
                        handle: { subject: "LibraryRacks", action: "Read"    },
                    },
                    {
                        path: "books",
                        element: <BookScreen />,
                        handle: { subject: "LibraryBooks", action: "Read" },
                    },
                    {
                        path: "issues",
                        element: <BookIssueScreen />,
                        handle: { subject: "LibraryBookIssue", action: "Read" },
                    },
                    {
                        path: "teachers-books",
                        element: <TeachersBooksScreen />,
                        handle: { subject: "LibraryMyBooks", action: "Read" },
                    }
                ]
            },
            {
                path: "/blog",
                children: [
                    {
                        index: true,
                        element: <BlogDashboard />,
                        handle: { subject: "Blog", action: "Read" }
                    },
                    {
                        path: "posts",
                        element: <PostScreen />,
                        handle: { subject: "BlogPosts", action: "Read" }
                    },
                    {
                        path: "comments",
                        element: <CommentScreen />,
                        handle: { subject: "BlogComments", action: "Read" }
                    },
                    {
                        path: "view",
                        element: <BlogViewScreen />,
                        handle: { subject: "BlogView", action: "Read" }
                    }
                ]
            },
            {
                path: '/attendance',
                children: [
                    {
                        path: '',
                        element: <AttendanceDashboard />,
                        handle: { subject: "Attendance", action: "Read" },
                    },
                    {
                        path: 'manual-attendance',
                        element: <AttendanceTabScreen />,
                        handle: { subject: "TeacherAttendance", action: "Read" }
                    },
                    {
                        path: 'attendance-reports',
                        element: <AttendanceReportsScreen />,
                        handle: { subject: "AttendanceReports", action: "Read" }
                    }
                ]
            },
            {
                path: '/feedback',
                children: [
                    {
                        index: true,
                        element: <ClassFeedbackList />,
                        handle: { subject: "ClassFeedback", action: "Read" }
                    },
                    {
                        path: 'class',
                        element: <ClassFeedbackList />,
                        handle: { subject: "ClassFeedback", action: "Read" }
                    },
                    {
                        path: 'class/new',
                        element: <ClassFeedback />,
                        handle: { subject: "ClassFeedback", action: "Create" }
                    },
                    {
                        path: 'subject',
                        element: <SubjectFeedbackList />,
                        handle: { subject: "SubjectFeedback", action: "Read" }
                    }
                    ,
                    {
                        path: 'subject/new',
                        element: <SubjectFeedback />,
                        handle: { subject: "SubjectFeedback", action: "Create" }
                    }
                ]
            },

        ],
    },
    {
        path: '/students',
        element: <Suspense fallback={<CustomLoader text="Loading..." />}>
            <DashBoardLayout>
                <ProtectedRouter />
            </DashBoardLayout>
        </Suspense>,
        children: [
            {
                index: true,
                element: <StudentDashboard />,
                handle: { subject: "StudentDashBoard" }
            },
                    {
                        path: 'feedback',
                        element: <StudentFeedback />,
                    },
                    {
                        path: 'discipline',
                        element: <StudentDiscipline />,
                    },
            {
                path: 'online-exam',
                handle: { subject: "StudentOnlineExam" },
                children: [
                    {
                        index: true,
                        element: <StudentOnlineExam />,
                    },
                    {
                        path: 'dashboard',
                        element: <OnlineExamDashboard />,
                    },
                    {
                        path: 'subject-exams/:subjectId',
                        element: <OnlineSubjectExam />,
                    },
                    {
                        path: 'exam-history',
                        element: <OnlineExamHistory />,
                    },
                    {
                        path: 'results/:examId',
                        children: [
                            {
                                index: true,
                                element: <OnlineExamResults />,
                            },
                            {
                                path: 'detailed',
                                element: <ExamHistory />,
                            }
                        ]
                    },
                    {
                        path: 'take/:examId',
                        element: <OnlineTakeExam />,
                    }
                ]
            },
            {
                path: 'online-assignment',
                handle: { subject: "StudentAssignment" },
                children: [
                    {
                        index: true,
                        element: <StudentOnlineAssignment />,
                    },
                    {
                        path: 'dashboard',
                        element: <AssignmentDashboard />,
                    },
                    {
                        path: 'subject/:subjectId',
                        element: <SubjectAssignments />,
                    },
                    {
                        path: 'view/:assignmentId',
                        element: <StudentViewAssignment />,
                    },
                    {
                        path: 'submit/:assignmentId',
                        element: <StudentSubmitAssignment />,
                    }
                ]
            },
            {
                path: 'exammark',
                children: [
                    {
                        index: true,
                        element: <StudentMarks />,
                        handle: { subject: "StudentSubjectMark" },
                    },
                    {
                        path: 'exam-subjects/:examName',
                        element: <ExamWiseSubjects />,
                        // handle: { subject: "ExamWiseSubjects" },
                    },
                    {
                        path: 'subject/:subjectId',
                        element: <SubjectDetails />,
                        // handle: { subject: "SubjectDetails" },
                    }
                ]
            },
            {
                path: 'profile',
                element: <UserProfile />,
            },
            {
                path: 'blog',
                element: <StudentBlogView />,
            },
            {
                path: 'library',
                element: <StudentLibraryView />,
            },
            {
                path: 'event-gallery',
                children: [
                    {
                        index: true,
                        element: <EventGalleryViewStudents />,
                    },
                    {
                        path: ':id',
                        element: <EventGalleryDetailStudents />,
                    },
                ],
            },
            {
                path: 'timetable',
                element: <StudentTimetable />,
                handle: { subject: "StudentTimetable" }
            },
            {
                path: 'subject-notes',
                element: <StudentSubjectNotes />,
                handle: { subject: "StudentSubjectNotes" }
            },
            {
                path: 'lesson-plans',
                element: <StudentLessonPlans />,
                handle: { subject: "StudentLessonPlans" }
            },
            {
                path: 'lesson-plans/:subjectId',
                element: <StudentLessonPlanSubject />,
                handle: { subject: "StudentLessonPlans" }
            },
            {
                path: 'attendance',
                element: <StudentAttendance />,
                handle: { subject: "StudentAttendance" }
            },
            {
                path: 'information',
                element: <StudentInformation />,
                handle: { subject: "Information" }
            },
            {
                path: 'information/view/:id',
                element: <ViewStudentInformation />,
                handle: { subject: "Information" }
            },
            {
                path: 'information/:category',
                element: <StudentInformationCategory />,
                handle: { subject: "Information" }
            }
        ]
    },

]);