import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const studentDashboardSlice = createApi({
    reducerPath: "studentDashboard",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["dashboard", "analytics", "timetable"],
    endpoints: (builder) => ({
        // Get comprehensive student dashboard data
        getStudentDashboard: builder.query({
            query: () => ({
                url: `v1/student-dashboard/dashboard`,
                method: 'GET',
            }),
            providesTags: ["dashboard"],
        }),

        // Get student performance analytics
        getStudentAnalytics: builder.query({
            query: () => ({
                url: `v1/student-dashboard/analytics`,
                method: 'GET',
            }),
            providesTags: ["analytics"],
        }),

        // Get student's timetable
        getStudentTimetable: builder.query({
            query: () => ({
                url: `v1/student-dashboard/timetable`,
                method: 'GET',
            }),
            providesTags: ["timetable"],
        }),
    }),
});

export const {
    useGetStudentDashboardQuery,
    useLazyGetStudentDashboardQuery,
    useGetStudentAnalyticsQuery,
    useLazyGetStudentAnalyticsQuery,
    useGetStudentTimetableQuery,
    useLazyGetStudentTimetableQuery,
} = studentDashboardSlice;
