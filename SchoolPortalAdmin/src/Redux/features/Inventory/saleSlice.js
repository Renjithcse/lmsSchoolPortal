import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

// Define the API slice for sales
export const saleApiSlice = createApi({
    reducerPath: "saleApi", // Unique key for this API slice
    baseQuery: baseQueryWithReauth,
    tagTypes: ["Sale"], // Tags for cache invalidation
    endpoints: (builder) => ({
        // Fetch all sales
        getSales: builder.query({
            query: () => "v1/inventory/sales",
            providesTags: ["Sale"], // Cache tag
        }),

        // Fetch a single sale by ID
        getSaleById: builder.query({
            query: (id) => `v1/inventory/sales/${id}`,
            providesTags: (result, error, id) => [{ type: "Sale", id }],
        }),

        // Create a new sale
        createSale: builder.mutation({
            query: (newSale) => ({
                url: "v1/inventory/sales",
                method: "POST",
                body: newSale,
            }),
            invalidatesTags: ["Sale"], // Invalidate cache to refetch sales
        }),

        // Update a sale
        updateSale: builder.mutation({
            query: ({ id, updatedSale }) => ({
                url: `v1/inventory/sales/${id}`,
                method: "PUT",
                body: updatedSale,
            }),
            invalidatesTags: ["Sale"],
        }),

        // Delete a sale
        deleteSale: builder.mutation({
            query: (id) => ({
                url: `v1/inventory/sales/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Sale"], // Invalidate cache to refetch sales
        }),
        getProductsByStore: builder.query({
            query: (storeId) => `v1/inventory/sales/products/${storeId}`,
            providesTags: (result, error, storeId) => [{ type: "Sale", id: storeId }],  
        }),
        dashboardData: builder.query({
            query: () => "v1/inventory/sales/dashboard"
        }),
        getSalesReportByDate: builder.query({
            query: (date) => `v1/inventory/sales/report/date?date=${date}`,
        }),
        getSalesReportBetweenDates: builder.query({
            query: ({ from, to }) =>
                `v1/inventory/sales/report/range?from=${from}&to=${to}`,
        }),
    }),
});

// Export hooks for usage in components
export const {
    useGetSalesQuery,
    useGetSaleByIdQuery,
    useCreateSaleMutation,
    useUpdateSaleMutation,
    useDeleteSaleMutation,
    useLazyGetProductsByStoreQuery,
    useDashboardDataQuery,
    useLazyGetSalesReportByDateQuery,
    useLazyGetSalesReportBetweenDatesQuery,
} = saleApiSlice;