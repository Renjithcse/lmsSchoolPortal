import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

// Define the API slice
export const subCategoryApiSlice = createApi({
    reducerPath: "subCategoryApi", // Unique key for this API slice
    baseQuery: baseQueryWithReauth,
    tagTypes: ["SubCategory"], // Tags for cache invalidation
    endpoints: (builder) => ({
        // Fetch all subcategories
        getSubCategories: builder.query({
            query: () => "v1/inventory/subcategory",
            providesTags: ["SubCategory"], // Cache tag
        }),

        // Fetch a single subcategory by ID
        getSubCategoryByCategoryId: builder.query({
            query: (id) => `v1/inventory/subcategory/${id}`,
            providesTags: (result, error, id) => [{ type: "SubCategory", id }],
        }),

        // Create a new subcategory
        createSubCategory: builder.mutation({
            query: (newSubCategory) => ({
                url: "v1/inventory/subcategory",
                method: "POST",
                body: newSubCategory,
            }),
            invalidatesTags: ["SubCategory"], // Invalidate cache to refetch subcategories
        }),

        // Update a subcategory
        updateSubCategory: builder.mutation({
            query: ({ id, updatedSubCategory }) => ({
                url: `v1/inventory/subcategory/${id}`,
                method: "PUT",
                body: updatedSubCategory,
            }),
            invalidatesTags: ["SubCategory"],
        }),

        // Delete a subcategory
        deleteSubCategory: builder.mutation({
            query: (id) => ({
                url: `v1/inventory/subcategory/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["SubCategory"], // Invalidate cache to refetch subcategories
        }),
    }),
});

// Export hooks for usage in components
export const {
    useGetSubCategoriesQuery,
    useLazyGetSubCategoryByCategoryIdQuery,
    useCreateSubCategoryMutation,
    useUpdateSubCategoryMutation,
    useDeleteSubCategoryMutation,
} = subCategoryApiSlice;