import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

// Define the API slice
export const productApiSlice = createApi({
    reducerPath: "productApi", // Unique key for this API slice
    baseQuery: baseQueryWithReauth,
    tagTypes: ["Product"], // Tags for cache invalidation
    endpoints: (builder) => ({
        // Fetch all products
        getProducts: builder.query({
            query: () => "v1/inventory/product",
            providesTags: ["Product"], // Cache tag
        }),

        // Fetch a single product by ID
        getProductById: builder.query({
            query: (id) => `v1/inventory/product/${id}`,
            providesTags: (result, error, id) => [{ type: "Product", id }],
        }),

        // Create a new product
        createProduct: builder.mutation({
            query: (newProduct) => ({
                url: "v1/inventory/product",
                method: "POST",
                body: newProduct,
            }),
            invalidatesTags: ["Product"], // Invalidate cache to refetch products
        }),

        // Update a product
        updateProduct: builder.mutation({
            query: ({ id, updatedProduct }) => ({
                url: `v1/inventory/product/${id}`,
                method: "PUT",
                body: updatedProduct,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "Product", id }],
        }),

        // Delete a product
        deleteProduct: builder.mutation({
            query: (id) => ({
                url: `v1/inventory/product/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Product"], // Invalidate cache to refetch products
        }),
    }),
});

// Export hooks for usage in components
export const {
    useGetProductsQuery,
    useGetProductByIdQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
} = productApiSlice;