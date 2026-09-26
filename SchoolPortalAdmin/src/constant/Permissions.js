export const Permissions = [
    {
        module: "Dashboard",
        route: [
            {
                route: "AdminDashboard",
                subject: "Dashboard",
                actions: [{ label: "Read", value: "Read" }]
            },
            {
                route: "Teacher Dashboard",
                subject: "TeacherSelfDashboard",
                actions: [{ label: "Read", value: "Read" }]
            },
        ]
    },
    {
        module: "Admin",
        route: [
            {
                route: "Academic",
                subject: "Academic",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Grade",
                subject: "Grade",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Term History",
                subject: "TermHistory",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Subject",
                subject: "Subject",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Religion",
                subject: "Religion",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Section",
                subject: "Section",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Grade Subject",
                subject: "GradeSubject",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Group Subject",
                subject: "GroupSubject",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Subject Student",
                subject: "SubjectStudent",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Exam",
                subject: "Exam",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Role Management",
                subject: "Roles",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Settings",
                subject: "Settings",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            }
        ]
    },
    {
        module: "Inventory",
        route: [
            {
                route: "Dashboard",
                subject: "Inventory",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Products",
                subject: "InventoryProducts",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Purchase",
                subject: "InventoryPurchase",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Category",
                subject: "InventoryCategory",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Sub Category",
                subject: "InventorySubCategory",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Unit",
                subject: "InventoryUnit",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Store",
                subject: "InventoryStore",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Sales",
                subject: "InventorySales",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Report",
                subject: "InventoryReport",
                actions: [{ label: "Read", value: "Read" }]
            }
        ]
    },
    {
        module: "Users",
        route: [
            {
                route: "Teachers",
                subject: "TeacherDashboard",
                actions: [{ label: "Read", value: "Read" }]
            },
            {
                route: "Teacher Management",
                subject: "Teacher",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Students",
                subject: "StudentDashboard",
                actions: [{ label: "Read", value: "Read" }]
            },
            {
                route: "Student Management",
                subject: "Student",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            }
        ]
    },
    {
        module: "Online Exam",
        route: [
            {
                route: "Question Bank",
                subject: "QuestionBank",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Exam",
                subject: "Exams",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Published Exams",
                subject: "PublishedExams",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            }

        ]
    },
    {
        module: "Assignments",
        route: [
            {
                route: "Dashboard",
                subject: "AssignmentsDashboard",
                actions: [{ label: "Read", value: "Read" }]
            },
            {
                route: "Assignments",
                subject: "Assignments",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" }, { label: "Publish", value: "Publish" }, { label: "Export", value: "Export" },]
            },
            {
                route: "Published Assignments",
                subject: "PublishedAssignments",
                actions: [{ label: "Read", value: "Read" }, { label: "Publish", value: "Publish" }, { label: "Delete", value: "Delete" }, { label: "Export", value: "Export" }]
            }
        ]
    },
    {
        module: "Mark Entry",
        route: [
            {
                route: "Dashboard",
                subject: "ExamMarkDashboard",
                actions: [{ label: "Read", value: "Read" }]
            },
            {
                route: "Exam Mark",
                subject: "ExamMark",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            }
        ]
    },
    {
        module: "Library",
        route: [
            {
                route: "Dashboard",
                subject: "Library",
                actions: [{ label: "Read", value: "Read" }]
            },
            {
                route: "Book Catalog",
                subject: "LibraryBookCatalog",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Book Issue",
                subject: "LibraryBookIssue",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Books",
                subject: "LibraryBooks",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "My Books",
                subject: "LibraryMyBooks",
                actions: [{ label: "Read", value: "Read" }]
            },
            {
                route: "Racks",
                subject: "LibraryRacks",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Categories",
                subject: "LibraryCategories",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            }
        ]
    },
    {
        module: "Blog",
        route: [
            {
                route: "Dashboard",
                subject: "Blog",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Posts",
                subject: "BlogPosts",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" }, { label: "Like", value: "Like" }, { label: "Approve", value: "Approve" }, { label: "Publish", value: "Publish" },]
            },
            {
                route: "Comments",
                subject: "BlogComments",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" }, { label: "Approve", value: "Approve" }, { label: "Like", value: "Like" },]
            },
            {
                route: "View Blog",
                subject: "BlogView",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            }
        ]
    },
    {
        module: "Attendance",
        route: [
            {
                route: "Dashboard",
                subject: "Attendance",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }]
            },
            {
                route: "Teacher Attendance",
                subject: "TeacherAttendance",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }]
            },
            {
                route: "Attendance Reports",
                subject: "AttendanceReports",
                actions: [{ label: "Read", value: "Read" }]
            }
        ]
    },
    {
        module: "Feedback",
        route: [
            {
                route: "Class Feedback",
                subject: "ClassFeedback",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" }]
            },
            {
                route: "Subject Feedback",
                subject: "SubjectFeedback",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" }]
            }
        ]
    },
    {
        module: "Timetable",
        route: [
            {
                route: "Timetable",
                subject: "Timetable",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            }
        ]
    },
    {
        module: "Subject Notes",
        route: [
            {
                route: "Subject Notes",
                subject: "SubjectNotes",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            }
        ]
    },
    {
        module: "Information",
        route: [
            {
                route: "Information",
                subject: "Information",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" }, { label: "Publish", value: "Publish" }, { label: "Archive", value: "Archive" },]
            }
        ]
    },
    {
        module: "Lesson Plans",
        route: [
            {
                route: "Lesson Plans",
                subject: "LessonPlans",
                actions: [{ label: "Create", value: "Create" }, { label: "Read", value: "Read" }, { label: "Edit", value: "Edit" }, { label: "Delete", value: "Delete" },]
            },
            {
                route: "Published Lesson Plans",
                subject: "PublishedLessonPlans",
                actions: [{ label: "Read", value: "Read" }]
            },
        ]   
    },
]

export const StudentPermissions = ["StudentDashBoard", "StudentOnlineExam", "StudentAssignment", "StudentSubjectMark", "StudentBlog", "StudentLibrary"]