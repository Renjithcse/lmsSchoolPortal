import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../config";
import { baseQueryWithReauth } from "../../helpers/NetworkHelper";

export const assignmentSlice = createApi({
    reducerPath: "assignment",
    tagTypes: ["listAssignment", "publishedAssignments"],
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        listAssignments: builder.query({
            query: (data) => ({
                url: `v1/assignment`,
                method: 'GET',
                params: data,
            }),
            providesTags: ["listAssignment"],
        }),
        addNewAssignment: builder.mutation({
            query: (data) => ({
                url: `v1/assignment`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["listAssignment"]
        }),
        updateAssignment: builder.mutation({
            query: ({id, data}) => ({
                url: `v1/assignment/${id}`,
                method: 'PUT',
                body: data,
            }),
        }),
        deleteAssignment: builder.mutation({
            query: (id) => ({
                url: `v1/assignment/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ["listAssignment"]
        }),
        viewAssignmentDetailsById: builder.query({
            query: (id) => ({
                url: `v1/assignment/${id}`,
                method: 'GET',
            }),
            providesTags: ["publishedAssignments"]
        }),
        publishedAssignments: builder.query({
            query: (id) => ({
                url: `v1/assignment/${id}/publish`,
                method: 'GET',
            }),
            
        }),
        newAssignmentPublish: builder.mutation({
            query: ({id, data}) => ({
                url: `v1/assignment/${id}/publish`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["publishedAssignments"]
        }),
        publishAssignmentDetailsById: builder.query({
            query: (publishId) => ({
                url: `v1/assignment/published/${publishId}`,
                method: 'GET',
            }),
        }),
        updatePublishedAssignment: builder.mutation({
            query: ({assignmentId, publishId, data}) => ({
                url: `v1/assignment/${assignmentId}/publish/${publishId}`,
                method: 'PUT',
                body: data,
            }),
        }),
        deletePublishedAssignment: builder.mutation({
            query: ({assignmentId, publishId}) => ({
                url: `v1/assignment/published/${publishId}`,
                method: 'DELETE',
            }),
        }),
        notPublishedSections: builder.query({
            query: (query) => ({
                url: `v1/assignment/${query?.assignment}/getNotPublishedSections`,
                method: 'GET',
                params: query,
            }),
        }),
        updateTeacherRemarks: builder.mutation({
            query: ({attemptId, data}) => ({
                url: `v1/assignment/teacher/${attemptId}`,
                method: 'PUT',
                body: data,
            }),
        }),
    }),

});

export const { 
    useListAssignmentsQuery,
    useLazyListAssignmentsQuery,
    useAddNewAssignmentMutation,
    useUpdateAssignmentMutation,
    useDeleteAssignmentMutation,
    useViewAssignmentDetailsByIdQuery,
    useLazyPublishedAssignmentsQuery,
    useNewAssignmentPublishMutation,
    usePublishAssignmentDetailsByIdQuery,
    useUpdatePublishedAssignmentMutation,
    useDeletePublishedAssignmentMutation,
    useLazyNotPublishedSectionsQuery,
    useUpdateTeacherRemarksMutation,
} = assignmentSlice;