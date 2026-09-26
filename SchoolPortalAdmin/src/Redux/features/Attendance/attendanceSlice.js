import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const attendanceSlice = createApi({
    reducerPath: "attendanceSlice",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["attendance", "attendanceStats"],
    endpoints: (builder) => ({
        // Mark attendance (biometric/RFID/mobile)
        markAttendance: builder.mutation({
            query: (data) => ({ 
                url: `v1/attendance/mark`, 
                method: 'POST',
                body: data
            }),
            invalidatesTags: ["attendance", "attendanceStats"]
        }),

        // Bulk mark attendance (web)
        bulkMarkAttendance: builder.mutation({
            query: (data) => ({ 
                url: `v1/attendance/bulk-mark`, 
                method: 'POST',
                body: data
            }),
            invalidatesTags: ["attendance", "attendanceStats"]
        }),

        // Get attendance by date
        getAttendanceByDate: builder.query({
            query: (params = {}) => ({ 
                url: `v1/attendance/by-date`, 
                method: 'GET',
                params: params
            }),
            providesTags: ["attendance"]
        }),

        // Get attendance by date range
        getAttendanceByDateRange: builder.query({
            query: (params = {}) => ({ 
                url: `v1/attendance/by-date-range`, 
                method: 'GET',
                params: params
            }),
            providesTags: ["attendance"]
        }),

        // Get attendance statistics
        getAttendanceStats: builder.query({
            query: (params = {}) => ({ 
                url: `v1/attendance/stats`, 
                method: 'GET',
                params: params
            }),
            providesTags: ["attendanceStats"]
        }),

        // Get attendance dashboard
        getAttendanceDashboard: builder.query({
            query: () => ({ 
                url: `v1/attendance/dashboard`, 
                method: 'GET'
            }),
            providesTags: ["attendanceStats"]
        }),

        // Get registered active students
        getRegisteredActiveStudents: builder.query({
            query: (params = {}) => ({ 
                url: `v1/attendance/registered-students`, 
                method: 'GET',
                params: params
            }),
            providesTags: ["attendance"]
        }),

        // Get student attendance
        getStudentAttendance: builder.query({
            query: ({ studentId, ...params }) => ({ 
                url: `v1/attendance/student/${studentId}`, 
                method: 'GET',
                params: params
            }),
            providesTags: ["attendance"]
        }),

        // Get teacher attendance
        getTeacherAttendance: builder.query({
            query: ({ teacherId, ...params }) => ({ 
                url: `v1/attendance/teacher/${teacherId}`, 
                method: 'GET',
                params: params
            }),
            providesTags: ["attendance"]
        }),

        // Get attendance summary report
        getAttendanceSummaryReport: builder.query({
            query: (params = {}) => ({ 
                url: `v1/attendance/summary-report`, 
                method: 'GET',
                params: params
            }),
            providesTags: ["attendanceStats"]
        }),

        // Get classwise attendance report
        getClasswiseAttendanceReport: builder.query({
            query: (params = {}) => ({ 
                url: `v1/attendance/classwise-report`, 
                method: 'GET',
                params: params
            }),
            providesTags: ["attendanceStats"]
        }),

        // Get today's overall attendance report
        getTodayOverallReport: builder.query({
            query: () => ({ 
                url: `v1/attendance/today-overall-report`, 
                method: 'GET'
            }),
            providesTags: ["attendanceStats"]
        }),

        // Get termwise attendance report
        getTermwiseAttendanceReport: builder.query({
            query: (params = {}) => ({ 
                url: `v1/attendance/termwise-report`, 
                method: 'GET',
                params: params
            }),
            providesTags: ["attendanceStats"]
        }),

        // Update attendance
        updateAttendance: builder.mutation({
            query: ({ id, ...data }) => ({ 
                url: `v1/attendance/${id}`, 
                method: 'PATCH',
                body: data
            }),
            invalidatesTags: ["attendance", "attendanceStats"]
        }),

        // Delete attendance
        deleteAttendance: builder.mutation({
            query: (id) => ({ 
                url: `v1/attendance/${id}`, 
                method: 'DELETE'
            }),
            invalidatesTags: ["attendance", "attendanceStats"]
        }),
    }),
});

export const {
    useMarkAttendanceMutation,
    useBulkMarkAttendanceMutation,
    useGetAttendanceByDateQuery,
    useGetAttendanceByDateRangeQuery,
    useGetAttendanceStatsQuery,
    useGetAttendanceDashboardQuery,
    useGetRegisteredActiveStudentsQuery,
    useGetStudentAttendanceQuery,
    useGetTeacherAttendanceQuery,
    useGetAttendanceSummaryReportQuery,
    useGetClasswiseAttendanceReportQuery,
    useGetTodayOverallReportQuery,
    useGetTermwiseAttendanceReportQuery,
    useUpdateAttendanceMutation,
    useDeleteAttendanceMutation
} = attendanceSlice;
