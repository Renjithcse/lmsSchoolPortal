import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../../config";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const roleSlice = createApi({
    reducerPath: "roles",
    tagTypes: ["roleLists", "singleRole"],
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        listRoles: builder.query({
            query: (params) => ({
                url: `v1/admin/roles`,
                method: 'GET',
                params: params,
            }),
            providesTags: ["roleLists"],
        }),
        createRole: builder.mutation({
            query: (data) => ({
                url: `v1/admin/roles`,
                method: 'POST',
                body: data
            }),
            invalidatesTags: ["roleLists"]
        }),
        getSingleRole : builder.query({
            query: (id) => ({
                url: `v1/admin/roles/${id}`,
                method: 'GET'
            }),
            providesTags: ["singleRole"],
        }),
        updateRole: builder.mutation({
            query: ({id, data}) => ({
                url: `v1/admin/roles/${id}`,
                method: 'PUT',
                body: data
            }),
            invalidatesTags: ["roleLists", "singleRole"]
        }),
        deleteRole: builder.mutation({
            query: (id) => ({
                url: `v1/admin/roles/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: ["roleLists"]
        }),
    }),

});

export const { 
    useListRolesQuery,
    useCreateRoleMutation,
    useGetSingleRoleQuery,
    useUpdateRoleMutation,
    useDeleteRoleMutation
} = roleSlice