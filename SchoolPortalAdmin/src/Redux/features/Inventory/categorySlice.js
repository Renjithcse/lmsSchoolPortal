import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

// Define the API slice
export const categoryApiSlice = createApi({
    reducerPath: "categoryApi", // Unique key for this API slice
    baseQuery: baseQueryWithReauth,
    tagTypes: ["Category"], // Tags for cache invalidation
    endpoints: (builder) => ({
        // Fetch all categories
        getCategories: builder.query({
            query: () => "v1/inventory/category",
            providesTags: ["Category"], // Cache tag
        }),

        // Fetch a single category by ID
        getCategoryById: builder.query({
            query: (id) => `v1/inventory/category/${id}`,
            providesTags: (result, error, id) => [{ type: "Category", id }],
        }),

        // Create a new category
        createCategory: builder.mutation({
            query: (newCategory) => ({
                url: "v1/inventory/category",
                method: "POST",
                body: newCategory,
            }),
            invalidatesTags: ["Category"], // Invalidate cache to refetch categories
        }),

        // Update a category
        updateCategory: builder.mutation({
            query: ({ id, updatedCategory }) => ({
                url: `v1/inventory/category/${id}`,
                method: "PUT",
                body: updatedCategory,
            }),
            invalidatesTags: ["Category"],
        }),

        // Delete a category
        deleteCategory: builder.mutation({
            query: (id) => ({
                url: `v1/inventory/category/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Category"], // Invalidate cache to refetch categories
        }),
    }),
});

// Export hooks for usage in components
export const {
    useGetCategoriesQuery,
    useGetCategoryByIdQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
} = categoryApiSlice;