import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../config";
import { baseQueryWithReauth } from "../../helpers/NetworkHelper";

export const markEntrySlice = createApi({
    reducerPath: "markEntry",
    tagTypes: ["listExams", "categoryLists", "studentMarks"],
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        listExams: builder.query({
            query: (params) => ({
                url: `v1/mark/exams`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["listExams"],
        }),
        createExam: builder.mutation({
            query: (params) => ({
                url: `v1/mark/exams`,
                method: 'POST',
                body: params,
            }),
            invalidatesTags: ["listExams"]
        }),
        updateExam: builder.mutation({
            query: ({ id, data }) => ({
                url: `v1/mark/exams/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["listExams"]
        }),
        deleteExam: builder.mutation({
            query: (id) => ({
                url: `v1/mark/exams/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ["listExams"]
        }),
        getCategory: builder.query({
            query: (data) => ({
                url: `v1/mark/student-marks`,
                method: 'GET',
                params: data,
            }),
            providesTags: ["categoryLists"],
        }),
        createCategory: builder.mutation({
            query: (data) => ({
                url: `v1/mark/categories`,
                method: 'POST',
                body: data
            }),
            invalidatesTags: ["categoryLists"]
        }),
        deleteCategory: builder.mutation({
            query: (id) => ({
                url: `v1/mark/categories/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ["categoryLists"]
        }),
        updateCategory: builder.mutation({
            query: (data) => ({
                url: `v1/mark/categories/${data.id}`,
                method: 'PUT',
                body: data
            }),
            invalidatesTags: ["categoryLists"]
        }),
        confirmCategory: builder.mutation({
            query: (data) => ({
                url: `v1/mark/categories`,
                method: 'PUT',
                body: data
            }),
            invalidatesTags: ["categoryLists"]
        }),
        saveStudentMark: builder.mutation({
            query: (data) => ({
                url: `v1/mark/student-marks`,
                method: 'POST',
                body: data
            }),
            invalidatesTags: ["categoryLists"]
        }),

        // Student mark endpoints
        getStudentMarkSummary: builder.query({
            query: (params) => ({
                url: `v1/students/mark/summary`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["studentMarks"],
        }),
        getStudentSubjectMarks: builder.query({
            query: ({ subjectId, ...params }) => ({
                url: `v1/students/mark/subject/${subjectId}`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["studentMarks"],
        }),
        getStudentExamDetails: builder.query({
            query: ({ examName, ...params }) => ({
                url: `v1/student/mark/exam/${examName}`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["studentMarks"],
        }),
        getStudentAllExams: builder.query({
            query: (params) => ({
                url: `v1/student/mark/exams`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["studentMarks"],
        }),
        getStudentExamSubjects: builder.query({
            query: (params) => ({
                url: `v1/students/mark/exam-subjects`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["studentMarks"],
        })

    }),

});

export const {
    useLazyListExamsQuery,
    useCreateExamMutation,
    useUpdateExamMutation,
    useDeleteExamMutation,
    useGetCategoryQuery,
    useCreateCategoryMutation,
    useDeleteCategoryMutation,
    useUpdateCategoryMutation,
    useConfirmCategoryMutation,
    useSaveStudentMarkMutation,
    // Student mark hooks
    useGetStudentMarkSummaryQuery,
    useGetStudentSubjectMarksQuery,
    useGetStudentExamDetailsQuery,
    useGetStudentAllExamsQuery,
    useGetStudentExamSubjectsQuery
} = markEntrySlice;