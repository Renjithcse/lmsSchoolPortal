import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../config";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const userSlice = createApi({
    reducerPath: "users",
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        registerTeacher: builder.mutation({
            query: (data) => ({
                url: `v1/auth/register-teacher`,
                method: 'POST',
                body: data
            }),
        }),
        teacherCodeVerify: builder.mutation({
            query: (data) => ({
                url: `v1/auth/teacher_code_verification`,
                method: 'POST',
                body: data
            }),
        }),
        teacherSignUp: builder.mutation({
            query: (data) => ({
                url: `v1/auth/teacher_signup`,
                method: 'POST',
                body: data
            }),
        }),
        logoutUser: builder.mutation({
            query: () => ({
                url: `v1/auth/logout`,
                method: 'PATCH',
            }),
        }),
        loginUser: builder.mutation({
            query: (data) => ({
                url: `v1/auth/login`,
                method: 'POST',
                body: data
            }),
        }),
        validateTwoFactor: builder.mutation({
            query: (data) => ({
                url: `v1/auth/validate2FA/authenticator`,
                method: 'POST',
                body: data
            }),
        }),
        enableTwoFactor: builder.mutation({
            query: () => ({
                url: `v1/auth/enable2FA`,
                method: 'POST'
            }),
        }),
        verifyTwoFactorSetup: builder.mutation({
            query: (data) => ({
                url: `v1/auth/verify2FA`,
                method: 'POST',
                body: data
            }),
        }),
        disableTwoFactor: builder.mutation({
            query: () => ({
                url: `v1/auth/disable2FA`,
                method: 'POST'
            }),
        }),
        getProfile: builder.query({
            query: () => ({
                url: `v1/user/me`,
                method: 'GET'
            })
        }),
        getUserByRole: builder.query({
            query: (role) => ({
                url: `v1/user/all?role=${role}`,
                method: 'GET'
            })
        }),
    }),

});

export const { 
    useRegisterTeacherMutation,
    useTeacherCodeVerifyMutation,
    useTeacherSignUpMutation,
    useLogoutUserMutation,
    useLoginUserMutation,
    useValidateTwoFactorMutation,
    useEnableTwoFactorMutation,
    useVerifyTwoFactorSetupMutation,
    useDisableTwoFactorMutation,
    useGetProfileQuery,
    useLazyGetProfileQuery,
    useLazyGetUserByRoleQuery
} = userSlice