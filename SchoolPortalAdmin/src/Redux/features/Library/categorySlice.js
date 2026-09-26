import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const categorySlice = createApi({
    reducerPath: "categorySlice",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["categories"],
    endpoints: (builder) => ({
        listCategories: builder.query({
            query: () => ({
                url: `v1/library/categories`,
                method: 'GET',
            }),
            providesTags: ["categories"],
        }),
        getCategoryById: builder.query({
            query: (id) => ({
                url: `v1/library/categories/${id}`,
                method: 'GET',
            }),
            providesTags: ["categories"],
        }),
        createCategory: builder.mutation({
            query: (data) => ({
                url: `v1/library/categories`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["categories"],
        }),
        updateCategory: builder.mutation({
            query: ({ id, data }) => ({
                url: `v1/library/categories/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["categories"],
        }),
        deleteCategory: builder.mutation({
            query: (id) => ({
                url: `v1/library/categories/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ["categories"],
        }),
    }),
});

export const {
    useListCategoriesQuery,
    useGetCategoryByIdQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
} = categorySlice;
