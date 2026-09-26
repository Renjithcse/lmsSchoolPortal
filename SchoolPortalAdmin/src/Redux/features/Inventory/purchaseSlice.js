import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

// Define the API slice for purchases
export const purchaseApiSlice = createApi({
    reducerPath: "purchaseApi", // Unique key for this API slice
    baseQuery: baseQueryWithReauth,
    tagTypes: ["Purchase"], // Tags for cache invalidation
    endpoints: (builder) => ({
        // Fetch all purchases
        getPurchases: builder.query({
            query: () => "v1/inventory/purchase",
            providesTags: ["Purchase"], // Cache tag
        }),

        // Fetch a single purchase by ID
        getPurchaseById: builder.query({
            query: (id) => `v1/inventory/purchase/${id}`,
            providesTags: (result, error, id) => [{ type: "Purchase", id }],
        }),

        // Create a new purchase
        createPurchase: builder.mutation({
            query: (newPurchase) => ({
                url: "v1/inventory/purchase",
                method: "POST",
                body: newPurchase,
            }),
            invalidatesTags: ["Purchase"], // Invalidate cache to refetch purchases
        }),

        // Update a purchase
        updatePurchase: builder.mutation({
            query: ({ id, updatedPurchase }) => ({
                url: `v1/inventory/purchase/${id}`,
                method: "PUT",
                body: updatedPurchase,
            }),
            invalidatesTags: ["Purchase"],
        }),

        // Delete a purchase
        deletePurchase: builder.mutation({
            query: (id) => ({
                url: `v1/inventory/purchase/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Purchase"], // Invalidate cache to refetch purchases
        }),
        // Fetch all stocks
        getAllStocks: builder.query({
            query: () => "v1/inventory/purchase/stocks",
        }),
    }),
});

// Export hooks for usage in components
export const {
    useGetPurchasesQuery,
    useGetPurchaseByIdQuery,
    useCreatePurchaseMutation,
    useUpdatePurchaseMutation,
    useDeletePurchaseMutation,
    useGetAllStocksQuery
} = purchaseApiSlice;