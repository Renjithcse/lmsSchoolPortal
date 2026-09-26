import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../../helpers/NetworkHelper';

export const studentLessonPlansApiSlice = createApi({
  reducerPath: 'studentLessonPlansApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['StudentLessonPlans'],
  endpoints: (builder) => ({
    getStudentLessonPlanSubjects: builder.query({
      query: () => 'v1/student/lesson-plans/subjects',
      providesTags: ['StudentLessonPlans']
    }),
    getStudentLessonPlansBySubject: builder.query({
      query: (subjectId) => `v1/student/lesson-plans/subject/${subjectId}`,
      providesTags: (result, error, subjectId) => [{ type: 'StudentLessonPlans', id: `subject-${subjectId}` }]
    }),
    getStudentLessonPlanDetail: builder.query({
      query: (planId) => `v1/student/lesson-plans/${planId}`,
      providesTags: (result, error, planId) => [{ type: 'StudentLessonPlans', id: `plan-${planId}` }]
    })
  })
});

export const {
  useGetStudentLessonPlanSubjectsQuery,
  useGetStudentLessonPlansBySubjectQuery,
  useGetStudentLessonPlanDetailQuery
} = studentLessonPlansApiSlice;
