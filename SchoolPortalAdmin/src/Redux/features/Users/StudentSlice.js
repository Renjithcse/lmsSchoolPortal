import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const studentSlice = createApi({
    reducerPath: "studentSlice",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["studentLists"],
    endpoints: (builder) => ({
        createStudent: builder.mutation({
            query: (data) => ({
                url: `v1/users/student/students`,
                method: 'POST',
                body: data
            }),
            invalidatesTags: ["studentLists"],
        }),
        getAllStudents: builder.query({
            query: (params) => ({
                url: `v1/users/student/students`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["studentLists"],
        }),
        getSingleStudentDetails: builder.query({
            query: (id) => ({
                url: `v1/users/student/students/${id}`,
                method: 'GET',
            }),
        }),
        updateStudent : builder.mutation({
            query: (data) => ({
                url: `v1/users/student/students/${data?._id}`,
                method: 'PUT',
                body: data
            }),
            invalidatesTags: ["studentLists"],
        }),
        verifyStudent: builder.mutation({
            query: (data) => ({
                url: `v1/users/student/verifyStudent`,
                method: 'POST',
                body: data
            })
        }),
        registerStudent: builder.mutation({
            query: (data) => ({
                url: `v1/auth/student_signup`,
                method: 'POST',
                body: data
            })
        })
    }),

});

export const { 
    useCreateStudentMutation,
    useGetAllStudentsQuery,
    useGetSingleStudentDetailsQuery,
    useUpdateStudentMutation,
    useVerifyStudentMutation,
    useRegisterStudentMutation,
} = studentSlice;