import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../../helpers/NetworkHelper';

export const attendanceApiSlice = createApi({
  reducerPath: 'attendanceApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Attendance', 'AttendanceStats', 'AttendanceDashboard', 'AttendanceReport'],
  endpoints: (builder) => ({
    // Get student attendance by student ID
    getStudentAttendance: builder.query({
      query: ({ startDate, endDate }) => ({
        url: `v1/attendance/student/me`,
        params: { startDate, endDate },
      }),
      providesTags: ['Attendance'],
    }),

    // Get attendance by date
    getAttendanceByDate: builder.query({
      query: ({ date, attendanceType, grade }) => ({
        url: 'v1/attendance/by-date',
        params: { date, attendanceType, grade },
      }),
      providesTags: ['Attendance'],
    }),

    // Get attendance by date range
    getAttendanceByDateRange: builder.query({
      query: ({ fromDate, toDate, grade, gender, section }) => ({
        url: 'v1/attendance/by-date-range',
        params: { fromDate, toDate, grade, gender, section },
      }),
      providesTags: ['Attendance'],
    }),

    // Get attendance statistics
    getAttendanceStats: builder.query({
      query: ({ startDate, endDate, attendanceType, grade }) => ({
        url: 'v1/attendance/stats',
        params: { startDate, endDate, attendanceType, grade },
      }),
      providesTags: ['AttendanceStats'],
    }),

    // Get attendance dashboard data
    getAttendanceDashboard: builder.query({
      query: () => ({
        url: 'v1/attendance/dashboard',
      }),
      providesTags: ['AttendanceDashboard'],
    }),

    // Get today's overall attendance report
    getTodayOverallReport: builder.query({
      query: () => ({
        url: 'v1/attendance/today-overall-report',
      }),
      providesTags: ['AttendanceReport'],
    }),

    // Get term-wise attendance report
    getTermwiseAttendanceReport: builder.query({
      query: ({ term, grade, gender, section, academicYear }) => ({
        url: 'v1/attendance/termwise-report',
        params: { term, grade, gender, section, academicYear },
      }),
      providesTags: ['AttendanceReport'],
    }),

    // Get classwise attendance report
    getClasswiseAttendanceReport: builder.query({
      query: ({ fromDate, toDate, grade, gender, section }) => ({
        url: 'v1/attendance/classwise-report',
        params: { fromDate, toDate, grade, gender, section },
      }),
      providesTags: ['AttendanceReport'],
    }),

    // Get attendance summary report
    getAttendanceSummaryReport: builder.query({
      query: ({ reportDate, summaryType, grade, gender, section }) => ({
        url: 'v1/attendance/summary-report',
        params: { reportDate, summaryType, grade, gender, section },
      }),
      providesTags: ['AttendanceReport'],
    }),

    // Mark attendance (for student self-attendance)
    markAttendance: builder.mutation({
      query: (attendanceData) => ({
        url: 'v1/attendance/mark',
        method: 'POST',
        body: attendanceData,
      }),
      invalidatesTags: ['Attendance', 'AttendanceStats', 'AttendanceDashboard'],
    }),

    // Update attendance
    updateAttendance: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `v1/attendance/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['Attendance', 'AttendanceStats'],
    }),

    // Delete attendance
    deleteAttendance: builder.mutation({
      query: (id) => ({
        url: `v1/attendance/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Attendance', 'AttendanceStats'],
    }),
  }),
});

export const {
  useGetStudentAttendanceQuery,
  useGetAttendanceByDateQuery,
  useGetAttendanceByDateRangeQuery,
  useGetAttendanceStatsQuery,
  useGetAttendanceDashboardQuery,
  useGetTodayOverallReportQuery,
  useGetTermwiseAttendanceReportQuery,
  useGetClasswiseAttendanceReportQuery,
  useGetAttendanceSummaryReportQuery,
  useMarkAttendanceMutation,
  useUpdateAttendanceMutation,
  useDeleteAttendanceMutation,
} = attendanceApiSlice;
