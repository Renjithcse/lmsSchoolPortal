import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../config";
import { baseQueryWithReauth } from "../../helpers/NetworkHelper";

export const studentAssignmentSlice = createApi({
    reducerPath: "studentAssignment",
    tagTypes: ["studentAssignments", "studentAssignmentDetails", "studentSubjectAssignments"],
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        // Get assignments summary for student (requires authentication)
        getStudentAssignmentsSummary: builder.query({
            query: () => ({
                url: `v1/students/assignments`,
                method: 'GET',
            }),
            providesTags: ["studentAssignments"],
        }),
        
        // Save student assignment submission
        saveStudentAssignment: builder.mutation({
            query: (data) => ({
                url: `v1/students/assignments`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["studentAssignments", "studentAssignmentDetails"],
        }),
        
        // Get subject-wise assignments for student
        getStudentSubjectAssignments: builder.query({
            query: (subjectId) => ({
                url: `v1/students/assignments/subject/${subjectId}`,
                method: 'GET',
            }),
            providesTags: ["studentSubjectAssignments"],
        }),
        
        // Get single assignment details for student
        getStudentAssignmentDetails: builder.query({
            query: (assignmentId) => ({
                url: `v1/students/assignments/${assignmentId}`,
                method: 'GET',
            }),
            providesTags: ["studentAssignmentDetails"],
        }),
    }),
});

export const { 
    useGetStudentAssignmentsSummaryQuery,
    useLazyGetStudentAssignmentsSummaryQuery,
    useSaveStudentAssignmentMutation,
    useGetStudentSubjectAssignmentsQuery,
    useLazyGetStudentSubjectAssignmentsQuery,
    useGetStudentAssignmentDetailsQuery,
    useLazyGetStudentAssignmentDetailsQuery,
} = studentAssignmentSlice; 