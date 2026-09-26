import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

// Define the API slice
export const unitApiSlice = createApi({
    reducerPath: "unitApi", // Unique key for this API slice
    baseQuery: baseQueryWithReauth,
    tagTypes: ["Unit"], // Tags for cache invalidation
    endpoints: (builder) => ({
        // Fetch all units
        getUnits: builder.query({
            query: () => "v1/inventory/unit",
            providesTags: ["Unit"], // Cache tag
        }),

        // Create a new unit
        createUnit: builder.mutation({
            query: (newUnit) => ({
                url: "v1/inventory/unit",
                method: "POST",
                body: newUnit,
            }),
            invalidatesTags: ["Unit"], // Invalidate cache to refetch units
        }),

        // Delete a unit
        deleteUnit: builder.mutation({
            query: (id) => ({
                url: `v1/inventory/unit/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Unit"], // Invalidate cache to refetch units
        }),
    }),
});

// Export hooks for usage in components
export const {
    useGetUnitsQuery,
    useCreateUnitMutation,
    useDeleteUnitMutation,
} = unitApiSlice;