import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const bookSlice = createApi({
    reducerPath: "bookSlice",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["books"],
    endpoints: (builder) => ({
        listBooks: builder.query({
            query: (params = {}) => ({
                url: `v1/library/books`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["books"],
        }),
        getBookById: builder.query({
            query: (id) => ({
                url: `v1/library/books/${id}`,
                method: 'GET',
            }),
            providesTags: ["books"],
        }),
        getBookByISBN: builder.query({
            query: (isbn) => ({
                url: `v1/library/books/isbn/${isbn}`,
                method: 'GET',
            }),
        }),
        getAvailablePositions: builder.query({
            query: (params = {}) => ({
                url: `v1/library/books/positions/available`,
                method: 'GET',
                params: params,
            }),
        }),
        getBookStats: builder.query({
            query: () => ({
                url: `v1/library/books/stats/overview`,
                method: 'GET',
            }),
        }),
        createBook: builder.mutation({
            query: (data) => ({
                url: `v1/library/books`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["books"],
        }),
        updateBook: builder.mutation({
            query: ({ id, data }) => ({
                url: `v1/library/books/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["books"],
        }),
        deleteBook: builder.mutation({
            query: (id) => ({
                url: `v1/library/books/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ["books"],
        }),
    }),
});

export const {
    useListBooksQuery,
    useGetBookByIdQuery,
    useGetBookByISBNQuery,
    useGetAvailablePositionsQuery,
    useGetBookStatsQuery,
    useCreateBookMutation,
    useUpdateBookMutation,
    useDeleteBookMutation,
} = bookSlice;
