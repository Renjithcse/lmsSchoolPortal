import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const onlineExamSlice = createApi({
    reducerPath: "onlineExam",
    tagTypes: [
        "examSummary", 
        "subjectExams", 
        "examDetails", 
        "examAttempts", 
        "examResults",
        "questionBank",
        "publishedExams"
    ],
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        // Get student exam summary (dashboard)
        getStudentExamSummary: builder.query({
            query: (params) => ({
                url: `v1/students/onlineExam`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["examSummary"],
        }),

        // Get subject-specific exam status
        getStudentSubjectExamStatus: builder.query({
            query: ({ subjectId, ...params }) => ({
                url: `v1/students/onlineExam/subject/${subjectId}`,
                method: 'GET',
                params: params,
            }),
            providesTags: (result, error, { subjectId }) => [
                { type: "subjectExams", id: subjectId }
            ],
        }),

        // Get single exam details (for taking exam)
        getSingleExamDetails: builder.query({
            query: (publishId) => ({
                url: `v1/students/onlineExam/exam/${publishId}`,
                method: 'GET',
            }),
            providesTags: (result, error, publishId) => [
                { type: "examDetails", id: publishId }
            ],
        }),

        // Submit student exam answers
        submitStudentExamAnswers: builder.mutation({
            query: (data) => ({
                url: `v1/students/onlineExam/submit`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["examSummary", "subjectExams", "examAttempts", "examResults"],
        }),

        // Get attended exam details (exam history)
        getStudentAttendedExamDetails: builder.query({
            query: (params) => ({
                url: `v1/students/onlineExam/attended`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["examAttempts"],
        }),

        // Get exam performance summary
        getStudentExamPerformance: builder.query({
            query: (params) => ({
                url: `v1/students/onlineExam/performance`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["examResults"],
        }),

        // Get exam analytics
        getStudentExamAnalytics: builder.query({
            query: (params) => ({
                url: `v1/students/onlineExam/analytics`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["examResults"],
        }),
    }),
});

export const {
    useGetStudentExamSummaryQuery,
    useLazyGetStudentExamSummaryQuery,
    useGetStudentSubjectExamStatusQuery,
    useLazyGetStudentSubjectExamStatusQuery,
    useGetSingleExamDetailsQuery,
    useLazyGetSingleExamDetailsQuery,
    useSubmitStudentExamAnswersMutation,
    useGetStudentAttendedExamDetailsQuery,
    useLazyGetStudentAttendedExamDetailsQuery,
    useGetStudentExamPerformanceQuery,
    useLazyGetStudentExamPerformanceQuery,
    useGetStudentExamAnalyticsQuery,
    useLazyGetStudentExamAnalyticsQuery,
} = onlineExamSlice; 