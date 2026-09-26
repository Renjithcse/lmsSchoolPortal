import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const subjectFeedbackSlice = createApi({
  reducerPath: "subjectFeedbackSlice",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["SubjectFeedbackStudents", "SubjectFeedbackList"],
  endpoints: (builder) => ({
    getSubjectFeedbackStudents: builder.query({
      query: (params) => ({
        url: `v1/users/teacher/subject-feedback/students`,
        method: "GET",
        params,
      }),
      providesTags: ["SubjectFeedbackStudents"],
    }),
    createSubjectFeedback: builder.mutation({
      query: (data) => ({
        url: `v1/users/teacher/subject-feedback`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SubjectFeedbackStudents", "SubjectFeedbackList"],
    }),
    getSubjectFeedbackList: builder.query({
      query: (params) => ({
        url: `v1/users/teacher/subject-feedback/list`,
        method: "GET",
        params,
      }),
      providesTags: ["SubjectFeedbackList"],
    }),
    updateSubjectFeedback: builder.mutation({
      query: ({ id, data }) => ({
        url: `v1/users/teacher/subject-feedback/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["SubjectFeedbackList"],
    }),
    deleteSubjectFeedback: builder.mutation({
      query: (id) => ({
        url: `v1/users/teacher/subject-feedback/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SubjectFeedbackList"],
    }),

    // Student
    getMySubjectFeedback: builder.query({
      query: (params) => ({
        url: `v1/student/subject-feedback/my`,
        method: "GET",
        params,
      }),
    }),
  }),
});

export const {
  useGetSubjectFeedbackStudentsQuery,
  useCreateSubjectFeedbackMutation,
  useGetSubjectFeedbackListQuery,
  useUpdateSubjectFeedbackMutation,
  useDeleteSubjectFeedbackMutation,
  useGetMySubjectFeedbackQuery,
} = subjectFeedbackSlice;

