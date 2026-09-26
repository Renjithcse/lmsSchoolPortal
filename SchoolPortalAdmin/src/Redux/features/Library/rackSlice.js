import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const rackSlice = createApi({
    reducerPath: "rackSlice",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["racks"],
    endpoints: (builder) => ({
        listRacks: builder.query({
            query: () => ({
                url: `v1/library/racks`,
                method: 'GET',
            }),
            providesTags: ["racks"],
        }),
        getRackById: builder.query({
            query: (id) => ({
                url: `v1/library/racks/${id}`,
                method: 'GET',
            }),
            providesTags: ["racks"],
        }),
        getRackStats: builder.query({
            query: (id) => ({
                url: `v1/library/racks/${id}/stats`,
                method: 'GET',
            }),
        }),
        createRack: builder.mutation({
            query: (data) => ({
                url: `v1/library/racks`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["racks"],
        }),
        updateRack: builder.mutation({
            query: ({ id, data }) => ({
                url: `v1/library/racks/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["racks"],
        }),
        deleteRack: builder.mutation({
            query: (id) => ({
                url: `v1/library/racks/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ["racks"],
        }),
    }),
});

export const {
    useListRacksQuery,
    useGetRackByIdQuery,
    useGetRackStatsQuery,
    useCreateRackMutation,
    useUpdateRackMutation,
    useDeleteRackMutation,
} = rackSlice;
