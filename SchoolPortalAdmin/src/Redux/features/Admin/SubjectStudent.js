import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const subjectStudentSlice = createApi({
    reducerPath: "subjectStudentSlice",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["subjectStudents"],
    endpoints: (builder) => ({
        listSubjectStudents: builder.query({
            query: (params) => ({
                url: `v1/admin/subject_students`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["subjectStudents"],
        }),
        addStudents : builder.mutation({
            query: (data) => ({
                url: `v1/admin/subject_students`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["subjectStudents"]
        }),
        deleteStudent : builder.mutation({
            query: (id) => ({
                url: `v1/admin/subject_students/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ["subjectStudents"]
        }),
    }),

});

export const { 
    useListSubjectStudentsQuery,
    useAddStudentsMutation,
    useDeleteStudentMutation
} = subjectStudentSlice