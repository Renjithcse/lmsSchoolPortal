import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const bookIssueSlice = createApi({
    reducerPath: "bookIssueSlice",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["bookIssues"],
    endpoints: (builder) => ({
        listBookIssues: builder.query({
            query: (params = {}) => ({
                url: `v1/library/issues`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["bookIssues"],
        }),
        getBookIssueById: builder.query({
            query: (id) => ({
                url: `v1/library/issues/${id}`,
                method: 'GET',
            }),
            providesTags: ["bookIssues"],
        }),
        getUserIssuedBooks: builder.query({
            query: ({ userType, userId }) => ({
                url: `v1/library/issues/user/${userType}/${userId}`,
                method: 'GET',
            }),
            providesTags: ["bookIssues"],
        }),
        getOverdueBooks: builder.query({
            query: () => ({
                url: `v1/library/issues/overdue/list`,
                method: 'GET',
            }),
            providesTags: ["bookIssues"],
        }),
        getLibraryStats: builder.query({
            query: () => ({
                url: `v1/library/issues/stats/overview`,
                method: 'GET',
            }),
        }),
        getTeachersIssuedBooks: builder.query({
            query: (params = {}) => ({
                url: `v1/library/issues/teachers/books`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["bookIssues"],
        }),
        issueBook: builder.mutation({
            query: (data) => ({
                url: `v1/library/issues/issue`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["bookIssues", "books"],
        }),
        returnBook: builder.mutation({
            query: (data) => ({
                url: `v1/library/issues/return`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["bookIssues", "books"],
        }),
        renewBook: builder.mutation({
            query: (id) => ({
                url: `v1/library/issues/${id}/renew`,
                method: 'PATCH',
            }),
            invalidatesTags: ["bookIssues"],
        }),
        payFine: builder.mutation({
            query: (id) => ({
                url: `v1/library/issues/${id}/pay-fine`,
                method: 'PATCH',
            }),
            invalidatesTags: ["bookIssues"],
        }),
    }),
});

export const {
    useListBookIssuesQuery,
    useGetBookIssueByIdQuery,
    useGetUserIssuedBooksQuery,
    useGetOverdueBooksQuery,
    useGetLibraryStatsQuery,
    useGetTeachersIssuedBooksQuery,
    useIssueBookMutation,
    useReturnBookMutation,
    useRenewBookMutation,
    usePayFineMutation,
} = bookIssueSlice;
