import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const classFeedbackSlice = createApi({
  reducerPath: "classFeedbackSlice",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["ClassFeedback", "ClassFeedbackStudents", "ClassFeedbackList"],
  endpoints: (builder) => ({
    // Teacher
    getMyClassTeacherClasses: builder.query({
      query: () => ({
        url: `v1/users/teacher/class-feedback/classes`,
        method: "GET",
      }),
      providesTags: ["ClassFeedback"],
    }),
    getStudentsForClassTeacher: builder.query({
      query: (params) => ({
        url: `v1/users/teacher/class-feedback/students`,
        method: "GET",
        params,
      }),
      providesTags: ["ClassFeedbackStudents"],
    }),
    createClassFeedback: builder.mutation({
      query: (data) => ({
        url: `v1/users/teacher/class-feedback`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ClassFeedback", "ClassFeedbackStudents", "ClassFeedbackList"],
    }),
    getClassFeedbackListForClass: builder.query({
      query: (params) => ({
        url: `v1/users/teacher/class-feedback/list`,
        method: "GET",
        params,
      }),
      providesTags: ["ClassFeedbackList"],
    }),
    updateClassFeedback: builder.mutation({
      query: ({ id, data }) => ({
        url: `v1/users/teacher/class-feedback/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["ClassFeedbackList"],
    }),
    deleteClassFeedback: builder.mutation({
      query: (id) => ({
        url: `v1/users/teacher/class-feedback/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ClassFeedbackList"],
    }),

    // Student
    getMyClassFeedback: builder.query({
      query: (params) => ({
        url: `v1/student/class-feedback/my`,
        method: "GET",
        params,
      }),
      providesTags: ["ClassFeedback"],
    }),
  }),
});

export const {
  useGetMyClassTeacherClassesQuery,
  useGetStudentsForClassTeacherQuery,
  useCreateClassFeedbackMutation,
  useGetClassFeedbackListForClassQuery,
  useUpdateClassFeedbackMutation,
  useDeleteClassFeedbackMutation,
  useGetMyClassFeedbackQuery,
} = classFeedbackSlice;

