import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const bookCatalogSlice = createApi({
    reducerPath: "bookCatalogSlice",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["bookCatalogs"],
    endpoints: (builder) => ({
        listBookCatalogs: builder.query({
            query: (params) => ({
                url: `v1/library/catalogs`,
                method: 'GET',
                params: params
            }),
            providesTags: ["bookCatalogs"],
        }),
        getBookCatalogById: builder.query({
            query: (id) => ({
                url: `v1/library/catalogs/${id}`,
                method: 'GET',
            }),
            providesTags: ["bookCatalogs"],
        }),
        getBookCatalogByISBN: builder.query({
            query: (isbn) => ({
                url: `v1/library/catalogs/isbn/${isbn}`,
                method: 'GET',
            }),
            providesTags: ["bookCatalogs"],
        }),
        createBookCatalog: builder.mutation({
            query: (data) => ({
                url: `v1/library/catalogs`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["bookCatalogs"],
        }),
        updateBookCatalog: builder.mutation({
            query: ({ id, data }) => ({
                url: `v1/library/catalogs/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["bookCatalogs"],
        }),
        deleteBookCatalog: builder.mutation({
            query: (id) => ({
                url: `v1/library/catalogs/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ["bookCatalogs"],
        }),
    }),
});

export const {
    useListBookCatalogsQuery,
    useGetBookCatalogByIdQuery,
    useGetBookCatalogByISBNQuery,
    useCreateBookCatalogMutation,
    useUpdateBookCatalogMutation,
    useDeleteBookCatalogMutation,
} = bookCatalogSlice;
