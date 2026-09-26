import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const teachersSlice = createApi({
    reducerPath: "teachersSlice",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["listTeachers", "subjectPermissionList"],
    endpoints: (builder) => ({
        listAllTeachers: builder.query({
            query: () => ({
                url: `v1/users/teacher`,
                method: 'GET',
            }),
            providesTags: ["listTeachers"],
        }),
        getTeacherProfile: builder.query({
            query: (id) => ({
                url: `v1/users/teacher/${id}`,
                method: 'GET',
            }),
        }),
        getAllGrade: builder.query({
            query: () => ({
                url: `v1/admin/grade`,
                method: 'GET',
            }),
        }),
        saveGradePermissions: builder.mutation({
            query: (data) => ({
                url: `v1/admin/GradePermissions`,
                method: 'POST',
                body: data
            }),
        }),
        getTeacherGradePermissions: builder.query({
            query: (teacherId) => ({
                url: `v1/admin/GradePermissions/getTeacherPermissions/${teacherId}`,
                method: 'GET',
            }),
        }),
        getMyGradePermissions: builder.query({
            query: (teacherId) => ({
                url: `v1/admin/GradePermissions/me`,
                method: 'GET',
            }),
        }),
        getMyGenderPermissions: builder.query({
            query: (params) => ({
                url: `v1/admin/GradePermissions/me/gender`,
                method: 'GET',
                params: params,
            }),
        }),
        getMySectionPermissions: builder.query({
            query: (params) => ({
                url: `v1/admin/GradePermissions/me/sections`,
                method: 'GET',
                params: params,
            }),
        }),
        saveTeacherSubjectPermission : builder.mutation({
            query: (data) => ({
                url: `v1/admin/subjectpermissions`,
                method: 'POST',
                body: data
            }),
            invalidatesTags: ["subjectPermissionList"]
        }),
        getTeacherSubjectPermission : builder.query({
            query: (teacherId) => ({
                url: `v1/admin/subjectpermissions/getTeacherPermissions/${teacherId}`,
                method: 'GET',
            }),
            providesTags: ["subjectPermissionList"]
        }),
        getMySubjectPermissions : builder.query({
            query: (params) => ({
                url: `v1/admin/subjectpermissions/me`,
                method: 'GET',
                params: params,
            }),
        }),
        getNotRegisteredSubjects: builder.query({
            query: (params) => ({
                url: `v1/admin/subjectpermissions/not-registerd-subjects`,
                method: 'GET',
                params: params,
            }),
        }),
        updateSubjectPermission: builder.mutation({
            query: ({id, data}) => ({
                url: `v1/admin/subjectpermissions/${id}`,
                method: 'PUT',
                body: data
            }),
            invalidatesTags: ["subjectPermissionList"]
        }),
        deleteSubjectPermission: builder.mutation({
            query: (id) => ({
                url: `v1/admin/subjectpermissions/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ["subjectPermissionList"]
        }),
        createTeacher: builder.mutation({
            query: (data) => ({
                url: `v1/users/teacher`,
                method: 'POST',
                body: data
            }),
            invalidatesTags: ["listTeachers"]
        }),
        updateTeacher: builder.mutation({
            query: ({ id, data }) => ({
                url: `v1/users/teacher/${id}`,
                method: 'PATCH',
                body: data
            }),
            invalidatesTags: ["listTeachers"]
        }),
        getMyTeacherSubjects: builder.query({
            query: (params) => ({
                url: `v1/users/teacher/subjects`,
                method: 'GET',
                params: params,
            }),
        }),
    }),

});

export const { 
    useListAllTeachersQuery,
    useGetTeacherProfileQuery,
    useGetAllGradeQuery,
    useSaveGradePermissionsMutation,
    useGetTeacherGradePermissionsQuery,
    useSaveTeacherSubjectPermissionMutation,
    useGetTeacherSubjectPermissionQuery,
    useLazyGetNotRegisteredSubjectsQuery,
    useUpdateSubjectPermissionMutation,
    useDeleteSubjectPermissionMutation,
    useGetMyGradePermissionsQuery,
    useLazyGetMyGradePermissionsQuery,
    useLazyGetMyGenderPermissionsQuery,
    useLazyGetMySectionPermissionsQuery,
    useLazyGetMySubjectPermissionsQuery,
    useCreateTeacherMutation,
    useUpdateTeacherMutation,
    useGetMyTeacherSubjectsQuery,
    useLazyGetMyTeacherSubjectsQuery
} = teachersSlice