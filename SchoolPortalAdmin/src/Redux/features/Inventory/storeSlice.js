import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

// Define the API slice for stores
export const storeApiSlice = createApi({
    reducerPath: "storeApi",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["Store"],
    endpoints: (builder) => ({
        // Fetch all stores
        getStores: builder.query({
            query: () => "v1/inventory/store",
            providesTags: ["Store"],
        }),

        // Fetch a single store by ID
        getStoreById: builder.query({
            query: (id) => `v1/inventory/store/${id}`,
            providesTags: (result, error, id) => [{ type: "Store", id }],
        }),

        // Create a new store
        createStore: builder.mutation({
            query: (newStore) => ({
                url: "v1/inventory/store",
                method: "POST",
                body: newStore,
            }),
            invalidatesTags: ["Store"],
        }),

        // Update a store
        updateStore: builder.mutation({
            query: ({ id, updatedStore }) => ({
                url: `v1/inventory/store/${id}`,
                method: "PUT",
                body: updatedStore,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "Store", id }, "Store"],
        }),

        // Delete a store
        deleteStore: builder.mutation({
            query: (id) => ({
                url: `v1/inventory/store/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Store"],
        }),
    }),
});

// Export hooks for usage in components
export const {
    useGetStoresQuery,
    useGetStoreByIdQuery,
    useCreateStoreMutation,
    useUpdateStoreMutation,
    useDeleteStoreMutation,
} = storeApiSlice;