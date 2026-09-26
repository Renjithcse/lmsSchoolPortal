import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const userDetailsSlice = createApi({
  reducerPath: "userDetailsSlice",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["userDetails", "userProfile", "academicHistory"],
  endpoints: (builder) => ({
    // Get comprehensive user details
    getUserDetails: builder.query({
      query: (userId) => ({
        url: `v1/user/details/${userId}`,
        method: 'GET',
      }),
      providesTags: ["userDetails"],
    }),

    // Get my profile (current user)
    getMyProfile: builder.query({
      query: () => ({
        url: 'v1/user/profile',
        method: 'GET',
      }),
      providesTags: ["userProfile"],
    }),

    // Update my profile
    updateMyProfile: builder.mutation({
      query: (profileData) => ({
        url: 'v1/user/profile',
        method: 'PATCH',
        body: profileData,
      }),
      invalidatesTags: ["userProfile", "userDetails"],
    }),

    // Get student academic history
    getStudentAcademicHistory: builder.query({
      query: (studentId) => ({
        url: `v1/user/student/${studentId}/academic-history`,
        method: 'GET',
      }),
      providesTags: ["academicHistory"],
    }),

    // Get user statistics
    getUserStats: builder.query({
      query: (userId) => ({
        url: `v1/user/stats/${userId}`,
        method: 'GET',
      }),
    }),

    // Send verification code (email/phone)
    sendVerificationCode: builder.mutation({
      query: (payload) => ({
        url: `v1/user/send-verification-code`,
        method: 'POST',
        body: payload,
      }),
    }),

    // Verify email or phone using code
    verifyEmailOrPhone: builder.mutation({
      query: (payload) => ({
        url: `v1/user/verify-email-or-phone`,
        method: 'POST',
        body: payload,
      }),
    }),

    // Get all users by role
    getUsersByRole: builder.query({
      query: (role) => ({
        url: `v1/user/all?role=${role}`,
        method: 'GET',
      }),
    }),

    // Get user by ID
    getUserById: builder.query({
      query: (userId) => ({
        url: `v1/user/${userId}`,
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useGetUserDetailsQuery,
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useGetStudentAcademicHistoryQuery,
  useGetUserStatsQuery,
  useGetUsersByRoleQuery,
  useGetUserByIdQuery,
  useSendVerificationCodeMutation,
  useVerifyEmailOrPhoneMutation,
} = userDetailsSlice; 