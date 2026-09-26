import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const groupSubjectSlice = createApi({
    reducerPath: "groupSubjectSlice",
    baseQuery: baseQueryWithReauth,
    tagTypes:["groupSubjects"],
    endpoints: (builder) => ({
        listGroupSubjects: builder.query({
            query: (params) => ({
                url: `v1/admin/group_subject`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["groupSubjects"],
        }),
        unassignedGroupSubjects: builder.query({
            query: (params) => ({
                url: `v1/admin/group_subject/unallocated-grade-subjects`,
                method: 'GET',
                params: params,
            }),
        }),
        createGroupSubject: builder.mutation({
            query: (data) => ({
                url: `v1/admin/group_subject`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["groupSubjects"],
        }),
        deleteGroupSubject: builder.mutation({
            query: (id) => ({
                url: `v1/admin/group_subject/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ["groupSubjects"],
        }),
        updateGroupSubject: builder.mutation({
            query: ({id, data}) => ({
                url: `v1/admin/group_subject/${id}`,
                method: 'PATCH',
                body: data
            }),
            invalidatesTags: ["groupSubjects"],
        }),
        checkCopyStatus: builder.query({
            query: (id) => ({
                url: `v1/admin/group_subject/${id}/copy-status`,
                method: 'GET',
            }),
        }),
        copyGroupSubject: builder.mutation({
            query: ({id, sections}) => ({
                url: `v1/admin/group_subject/${id}/copy`,
                method: 'POST',
                body: { sections },
            }),
            invalidatesTags: ["groupSubjects"],
        }),
    }),

});

export const { 
    useListGroupSubjectsQuery,
    useUnassignedGroupSubjectsQuery,
    useCreateGroupSubjectMutation,
    useDeleteGroupSubjectMutation,
    useUpdateGroupSubjectMutation,
    useCheckCopyStatusQuery,
    useCopyGroupSubjectMutation
} = groupSubjectSlice