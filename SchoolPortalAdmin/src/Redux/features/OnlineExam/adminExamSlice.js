import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const adminExamSlice = createApi({
    reducerPath: "adminExam",
    tagTypes: [
        "onlineExams", 
        "questionBanks", 
        "questions", 
        "publishedExams",
        "examResults",
        "studentPerformance"
    ],
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        // Create new online exam
        createOnlineExam: builder.mutation({
            query: (data) => ({
                url: `v1/onlineExam`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["onlineExams"],
        }),

        // Get all online exams
        getOnlineExams: builder.query({
            query: (params) => ({
                url: `v1/onlineExam`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["onlineExams"],
        }),

        // Get single online exam details
        getOnlineExamById: builder.query({
            query: (id) => ({
                url: `v1/onlineExam/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [
                { type: "onlineExams", id }
            ],
        }),

        // Update online exam
        updateOnlineExam: builder.mutation({
            query: ({ id, data }) => ({
                url: `v1/onlineExam/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["onlineExams"],
        }),

        // Delete online exam
        deleteOnlineExam: builder.mutation({
            query: (id) => ({
                url: `v1/onlineExam/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ["onlineExams"],
        }),

        // Create question bank
        createQuestionBank: builder.mutation({
            query: (data) => ({
                url: `v1/onlineExam/questionBank`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["questionBanks"],
        }),

        // Get question banks
        getQuestionBanks: builder.query({
            query: (params) => ({
                url: `v1/onlineExam/questionBank`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["questionBanks"],
        }),

        // Get question bank by ID
        getQuestionBankById: builder.query({
            query: (id) => ({
                url: `v1/onlineExam/questionBank/${id}`,
                method: 'GET',
            }),
            providesTags: (result, error, id) => [
                { type: "questionBanks", id }
            ],
        }),

        // Update question bank
        updateQuestionBank: builder.mutation({
            query: ({ id, data }) => ({
                url: `v1/onlineExam/questionBank/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["questionBanks"],
        }),

        // Delete question bank
        deleteQuestionBank: builder.mutation({
            query: (id) => ({
                url: `v1/onlineExam/questionBank/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ["questionBanks"],
        }),

        // Add questions to question bank
        addQuestionsToBank: builder.mutation({
            query: ({ questionBankId, data }) => ({
                url: `v1/onlineExam/questionBank/${questionBankId}/questions`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["questions", "questionBanks"],
        }),

        // Get questions from question bank
        getQuestionsFromBank: builder.query({
            query: (questionBankId) => ({
                url: `v1/onlineExam/questionBank/${questionBankId}/questions`,
                method: 'GET',
            }),
            providesTags: (result, error, questionBankId) => [
                { type: "questions", id: questionBankId }
            ],
        }),

        // Update question
        updateQuestion: builder.mutation({
            query: ({ questionBankId, questionId, data }) => ({
                url: `v1/onlineExam/questionBank/${questionBankId}/questions/${questionId}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["questions"],
        }),

        // Delete question
        deleteQuestion: builder.mutation({
            query: ({ questionBankId, questionId }) => ({
                url: `v1/onlineExam/questionBank/${questionBankId}/questions/${questionId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ["questions"],
        }),

        // Publish exam
        publishExam: builder.mutation({
            query: ({ examId, data }) => ({
                url: `v1/onlineExam/${examId}/publish`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["publishedExams"],
        }),

        // Get published exams
        getPublishedExams: builder.query({
            query: (params) => ({
                url: `v1/onlineExam/published`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["publishedExams"],
        }),

        // Update published exam
        updatePublishedExam: builder.mutation({
            query: ({ examId, publishId, data }) => ({
                url: `v1/onlineExam/${examId}/publish/${publishId}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["publishedExams"],
        }),

        // Delete published exam
        deletePublishedExam: builder.mutation({
            query: ({ examId, publishId }) => ({
                url: `v1/onlineExam/${examId}/publish/${publishId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ["publishedExams"],
        }),

        // Get exam results
        getExamResults: builder.query({
            query: (params) => ({
                url: `v1/onlineExam/results`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["examResults"],
        }),

        // Get student performance
        getStudentPerformance: builder.query({
            query: (params) => ({
                url: `v1/onlineExam/student-performance`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["studentPerformance"],
        }),

        // Get exam analytics
        getExamAnalytics: builder.query({
            query: (params) => ({
                url: `v1/onlineExam/analytics`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["examResults"],
        }),
    }),
});

export const {
    // Exam Management
    useCreateOnlineExamMutation,
    useGetOnlineExamsQuery,
    useLazyGetOnlineExamsQuery,
    useGetOnlineExamByIdQuery,
    useLazyGetOnlineExamByIdQuery,
    useUpdateOnlineExamMutation,
    useDeleteOnlineExamMutation,

    // Question Bank Management
    useCreateQuestionBankMutation,
    useGetQuestionBanksQuery,
    useLazyGetQuestionBanksQuery,
    useGetQuestionBankByIdQuery,
    useLazyGetQuestionBankByIdQuery,
    useUpdateQuestionBankMutation,
    useDeleteQuestionBankMutation,

    // Question Management
    useAddQuestionsToBankMutation,
    useGetQuestionsFromBankQuery,
    useLazyGetQuestionsFromBankQuery,
    useUpdateQuestionMutation,
    useDeleteQuestionMutation,

    // Exam Publishing
    usePublishExamMutation,
    useGetPublishedExamsQuery,
    useLazyGetPublishedExamsQuery,
    useUpdatePublishedExamMutation,
    useDeletePublishedExamMutation,

    // Results and Analytics
    useGetExamResultsQuery,
    useLazyGetExamResultsQuery,
    useGetStudentPerformanceQuery,
    useLazyGetStudentPerformanceQuery,
    useGetExamAnalyticsQuery,
    useLazyGetExamAnalyticsQuery,
} = adminExamSlice; 