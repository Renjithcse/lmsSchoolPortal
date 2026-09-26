import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import counterReducer from "./features/counterSlice";
import { apiSlice } from "./features/apiSlice";
import { commonSlice } from "./features/commonSlice";
import { assignmentSlice } from "./features/assignmentSlice";
import { markEntrySlice } from "./features/MarkEntry";
import { roleSlice } from "./features/Admin/RolesSlice";
import { userSlice } from "./features/auth/userSlice";
import authReducer from './features/auth/authSlice';
import { gradeSubjectSlice } from "./features/Admin/GradeSubject";
import { groupSubjectSlice } from "./features/Admin/GroupSubjects";
import { subjectStudentSlice } from "./features/Admin/SubjectStudent";
import { teachersSlice } from "./features/Admin/TeachersSlice";
import { settingsSlice } from "./features/Admin/SettingsSlice";
import { academicSlice } from "./features/Admin/academicSlice";
import { timetableApiSlice } from "./features/Admin/timetableApiSlice";
import { studentSlice } from "./features/Users/StudentSlice";
import { productApiSlice } from "./features/Inventory/productSlice";
import { categoryApiSlice } from "./features/Inventory/categorySlice";
import { subCategoryApiSlice } from "./features/Inventory/subCategorySlice";
import { unitApiSlice } from "./features/Inventory/unitSlice";
import { storeApiSlice } from "./features/Inventory/storeSlice";
import { purchaseApiSlice } from "./features/Inventory/purchaseSlice";
import { saleApiSlice } from "./features/Inventory/saleSlice";
import { userDetailsSlice } from "./features/Users/userDetailsSlice";
import { studentAssignmentSlice } from "./features/studentAssignmentSlice";
import { studentDashboardSlice } from "./features/Users/studentDashboardSlice";
import { classFeedbackSlice } from "./features/Feedback/ClassFeedbackSlice";
import { subjectFeedbackSlice } from "./features/Feedback/SubjectFeedbackSlice";
import classFeedbackFiltersReducer from "./features/Feedback/classFeedbackFilterSlice";
import subjectFeedbackFiltersReducer from "./features/Feedback/subjectFeedbackFilterSlice";

// Import library slices
import { rackSlice } from "./features/Library/rackSlice";
import { bookSlice } from "./features/Library/bookSlice";
import { bookCatalogSlice } from "./features/Library/bookCatalogSlice";
import { bookIssueSlice } from "./features/Library/bookIssueSlice";
import { userLibrarySlice } from "./features/Library/userLibrarySlice";
import { categorySlice } from "./features/Library/categorySlice";

// Import blog slices
import { postSlice } from "./features/Blog/postSlice";
import { commentSlice } from "./features/Blog/commentSlice";

// Import attendance slices
import { attendanceSlice } from "./features/Attendance/attendanceSlice";
import { attendanceApiSlice } from "./features/Attendance/attendanceApiSlice";

// Import online exam slices
import { onlineExamSlice, adminExamSlice, examStateReducer } from "./features/OnlineExam";
import { examFiltersReducer } from "./features/OnlineExam/examFiltersSlice";

// Import subject notes slices
import { subjectNotesApiSlice } from "./features/Admin/subjectNotesApiSlice";
import chaptersReducer from "./features/Admin/chaptersSlice";
import { studentSubjectNotesApiSlice } from "./features/Student/studentSubjectNotesApiSlice";
import { studentLessonPlansApiSlice } from "./features/Student/studentLessonPlansApiSlice";
import { assignmentFiltersReducer } from "./features/assignmentFiltersSlice";

// Import information slices
import { studentInformationApiSlice } from "./features/Student/studentInformationApiSlice";
import { informationApiSlice } from "./features/Admin/informationApiSlice";
import { lessonPlansApiSlice } from "./features/Admin/lessonPlansApiSlice";
import { lessonPlanFiltersReducer } from "./features/Admin/lessonPlanFiltersSlice";
import { timetableFiltersReducer } from "./features/Admin/timetableFiltersSlice";

// Import event gallery slice
import { eventGallerySlice } from "./features/Admin/eventGallerySlice";
import { studentEventGalleryApiSlice } from "./features/Student/eventGalleryApiSlice";


const store = configureStore({
    reducer: {
        counter: counterReducer, // Add your counter slice
        [apiSlice.reducerPath]: apiSlice.reducer, // Add the API slice
        [commonSlice.reducerPath]: commonSlice.reducer, // Add the common slice]
        [assignmentSlice.reducerPath]: assignmentSlice.reducer, // Add the assignment slice]
        [markEntrySlice.reducerPath]: markEntrySlice.reducer, // Add the mark entry slice
        [roleSlice.reducerPath]: roleSlice.reducer, // Add the role slice]
        [userSlice.reducerPath] : userSlice.reducer, // Add the user slice
        [gradeSubjectSlice.reducerPath] : gradeSubjectSlice.reducer, // Add the user slice
        [groupSubjectSlice.reducerPath] : groupSubjectSlice.reducer, // Add the user slice
        [subjectStudentSlice.reducerPath] : subjectStudentSlice.reducer, // Add the
        [teachersSlice.reducerPath] : teachersSlice.reducer, // Add the
        [settingsSlice.reducerPath] : settingsSlice.reducer, // Add the
        [academicSlice.reducerPath] : academicSlice.reducer, // Add the
        [timetableApiSlice.reducerPath]: timetableApiSlice.reducer,
        [studentSlice.reducerPath] : studentSlice.reducer, // Add the
        [productApiSlice.reducerPath] : productApiSlice.reducer, 
        [categoryApiSlice.reducerPath] : categoryApiSlice.reducer, 
        [subCategoryApiSlice.reducerPath] : subCategoryApiSlice.reducer, 
        [unitApiSlice.reducerPath] : unitApiSlice.reducer, 
        [storeApiSlice.reducerPath] : storeApiSlice.reducer, 
        [purchaseApiSlice.reducerPath] : purchaseApiSlice.reducer, 
        [saleApiSlice.reducerPath] : saleApiSlice.reducer, 
        [userDetailsSlice.reducerPath] : userDetailsSlice.reducer,
        [studentAssignmentSlice.reducerPath] : studentAssignmentSlice.reducer,
        [studentDashboardSlice.reducerPath] : studentDashboardSlice.reducer,
        [classFeedbackSlice.reducerPath]: classFeedbackSlice.reducer,
        [subjectFeedbackSlice.reducerPath]: subjectFeedbackSlice.reducer,
        classFeedbackFilters: classFeedbackFiltersReducer,
        subjectFeedbackFilters: subjectFeedbackFiltersReducer,
        
        // Library slices
        [rackSlice.reducerPath]: rackSlice.reducer,
        [bookSlice.reducerPath]: bookSlice.reducer,
        [bookCatalogSlice.reducerPath]: bookCatalogSlice.reducer,
        [bookIssueSlice.reducerPath]: bookIssueSlice.reducer,
        [userLibrarySlice.reducerPath]: userLibrarySlice.reducer,
        [categorySlice.reducerPath]: categorySlice.reducer,
        
        // Blog slices
        [postSlice.reducerPath]: postSlice.reducer,
        [commentSlice.reducerPath]: commentSlice.reducer,
        
        // Attendance slices
        [attendanceSlice.reducerPath]: attendanceSlice.reducer,
        [attendanceApiSlice.reducerPath]: attendanceApiSlice.reducer,
        
        // Online Exam slices
        [onlineExamSlice.reducerPath]: onlineExamSlice.reducer,
        [adminExamSlice.reducerPath]: adminExamSlice.reducer,
        examState: examStateReducer,
        examFilters: examFiltersReducer,
        
        // Subject Notes slices
        [subjectNotesApiSlice.reducerPath]: subjectNotesApiSlice.reducer,
        chapters: chaptersReducer,
        [studentSubjectNotesApiSlice.reducerPath]: studentSubjectNotesApiSlice.reducer,
        [studentLessonPlansApiSlice.reducerPath]: studentLessonPlansApiSlice.reducer,

        // Information slices
        [studentInformationApiSlice.reducerPath]: studentInformationApiSlice.reducer,
        [informationApiSlice.reducerPath]: informationApiSlice.reducer,
        [lessonPlansApiSlice.reducerPath]: lessonPlansApiSlice.reducer,
        lessonPlanFilters: lessonPlanFiltersReducer,
        assignmentFilters: assignmentFiltersReducer,
        timetableFilters: timetableFiltersReducer,
        
        // Event Gallery slice
        [eventGallerySlice.reducerPath]: eventGallerySlice.reducer,
        [studentEventGalleryApiSlice.reducerPath]: studentEventGalleryApiSlice.reducer,
        
        auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['auth/setAbility'],
                ignoredPaths: ['auth.ability'],
            },
        }).concat(
            apiSlice.middleware, 
            commonSlice.middleware, 
            assignmentSlice.middleware, 
            markEntrySlice.middleware,
            roleSlice.middleware,
            userSlice.middleware,
            gradeSubjectSlice.middleware,
            groupSubjectSlice.middleware,
            subjectStudentSlice.middleware,
            teachersSlice.middleware,
            settingsSlice.middleware,
            academicSlice.middleware,
            studentSlice.middleware,
            productApiSlice.middleware,
            subCategoryApiSlice.middleware,
            categoryApiSlice.middleware,
            unitApiSlice.middleware,
            storeApiSlice.middleware,
            purchaseApiSlice.middleware,
            saleApiSlice.middleware,
            userDetailsSlice.middleware,
            studentAssignmentSlice.middleware,
            studentDashboardSlice.middleware,
            classFeedbackSlice.middleware,
            subjectFeedbackSlice.middleware,
            
            // Library middleware
            rackSlice.middleware,
            bookSlice.middleware,
            bookCatalogSlice.middleware,
            bookIssueSlice.middleware,
            userLibrarySlice.middleware,
            categorySlice.middleware,
            
            // Blog middleware
            postSlice.middleware,
            commentSlice.middleware,
            
            // Attendance middleware
            attendanceSlice.middleware,
            attendanceApiSlice.middleware,
            
            // Online Exam middleware
            onlineExamSlice.middleware,
            adminExamSlice.middleware,
            
            // Information API middleware
            informationApiSlice.middleware,
            studentInformationApiSlice.middleware,
            lessonPlansApiSlice.middleware,
            subjectNotesApiSlice.middleware,
            eventGallerySlice.middleware,
            studentEventGalleryApiSlice.middleware,
            studentSubjectNotesApiSlice.middleware,
            studentLessonPlansApiSlice.middleware,
            timetableApiSlice.middleware,
        ),
});

setupListeners(store.dispatch);

export default store;
