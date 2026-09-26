import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const gradeSubjectSlice = createApi({
    reducerPath: "gradeSubjectSlice",
    baseQuery: baseQueryWithReauth,
    tagTypes:["gradeSubjects", "classTeacher"],
    endpoints: (builder) => ({
        listGradeSubjects: builder.query({
            query: (params) => ({
                url: `v1/admin/grade_subject`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["gradeSubjects"],
        }),
        unassignedGradeSubjects: builder.query({
            query: (params) => ({
                url: `v1/admin/grade_subject/unassigned-subjects`,
                method: 'GET',
                params: params,
            }),
        }),
        getAvailableGendersForCopy: builder.query({
            query: (params) => ({
                url: `v1/admin/grade_subject/available-genders-copy`,
                method: 'GET',
                params: params,
            }),
        }),
        getAvailableSectionsForCopy: builder.query({
            query: (params) => ({
                url: `v1/admin/grade_subject/available-sections-copy`,
                method: 'GET',
                params: params,
            }),
        }),
        createGradeSubject: builder.mutation({
            query: (data) => ({
                url: `v1/admin/grade_subject`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["gradeSubjects"],
        }),
        deleteGradeSubject: builder.mutation({
            query: (id) => ({
                url: `v1/admin/grade_subject/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ["gradeSubjects"],
        }),
        getAllTeachers: builder.query({
            query: (params) => ({
                url: `v1/admin/grade_subject/list-teachers`,
                method: 'GET',
                params: params,
            }),
        }),
        updateGradeSubject: builder.mutation({
            query: ({id, data}) => ({
                url: `v1/admin/grade_subject/${id}`,
                method: 'PATCH',
                body: data
            }),
            invalidatesTags: ["gradeSubjects"],
        }),
        copyGradeSubjects: builder.mutation({
            query: (data) => ({
                url: `v1/admin/grade_subject/copy-subjects`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["gradeSubjects"],
        }),
        bulkAssignTeacher: builder.mutation({
            query: (data) => ({
                url: `v1/admin/grade_subject/bulk-assign-teacher`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["gradeSubjects"],
        }),
        getClassTeacher: builder.query({
            query: (params) => ({
                url: `v1/admin/grade_subject/class-teacher`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["classTeacher"],
        }),
        setClassTeacher: builder.mutation({
            query: (data) => ({
                url: `v1/admin/grade_subject/class-teacher`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["classTeacher"],
        }),
    }),

});

export const { 
    useListGradeSubjectsQuery,
    useUnassignedGradeSubjectsQuery,
    useCreateGradeSubjectMutation,
    useDeleteGradeSubjectMutation,
    useGetAllTeachersQuery,
    useUpdateGradeSubjectMutation,
    useCopyGradeSubjectsMutation,
    useGetAvailableGendersForCopyQuery,
    useGetAvailableSectionsForCopyQuery,
    useBulkAssignTeacherMutation,
    useGetClassTeacherQuery,
    useSetClassTeacherMutation
} = gradeSubjectSlice