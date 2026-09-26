import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const userLibrarySlice = createApi({
    reducerPath: "userLibrarySlice",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["userBooks", "userHistory", "userStats"],
    endpoints: (builder) => ({
        // Get current user's issued books
        getMyIssuedBooks: builder.query({
            query: () => ({ url: `v1/library/user/my-books`, method: 'GET' }),
            providesTags: ["userBooks"]
        }),

        // Get current user's library history
        getMyLibraryHistory: builder.query({
            query: (params = {}) => ({ 
                url: `v1/library/user/my-history`, 
                method: 'GET',
                params: params
            }),
            providesTags: ["userHistory"]
        }),

        // Get current user's library statistics
        getMyLibraryStats: builder.query({
            query: () => ({ url: `v1/library/user/my-stats`, method: 'GET' }),
            providesTags: ["userStats"]
        }),

        // Get available books for browsing
        getAvailableBooks: builder.query({
            query: (params = {}) => ({ 
                url: `v1/library/user/available-books`, 
                method: 'GET',
                params: params
            }),
            providesTags: ["availableBooks"]
        }),

        // Request book renewal
        requestRenewal: builder.mutation({
            query: (bookIssueId) => ({ 
                url: `v1/library/user/renew/${bookIssueId}`, 
                method: 'PATCH'
            }),
            invalidatesTags: ["userBooks", "userStats"]
        }),
    }),
});

export const {
    useGetMyIssuedBooksQuery,
    useGetMyLibraryHistoryQuery,
    useGetMyLibraryStatsQuery,
    useGetAvailableBooksQuery,
    useRequestRenewalMutation
} = userLibrarySlice;
