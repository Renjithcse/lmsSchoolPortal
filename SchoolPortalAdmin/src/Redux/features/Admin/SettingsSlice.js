import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const settingsSlice = createApi({
    reducerPath: "settingsSlice",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["settings"],
    endpoints: (builder) => ({
        getSetting: builder.query({
            query: () => ({
                url: `v1/admin/settings`,
                method: 'GET',
            }),
            providesTags: ["settings"],
        }),
        createSetting: builder.mutation({
            query: (data) => ({
                url: `v1/admin/settings`,
                method: 'POST',
                body: data
            }),
            invalidatesTags: ["settings"]
        }),
        updateSetting: builder.mutation({
            query: ({id, data}) => ({
                url: `v1/admin/settings/${id}`,
                method: 'PUT',
                body: data
            }),
            invalidatesTags: ["settings"],
        }),
        getSchoolTimings: builder.query({
            query: ({gradeId, gender}) => ({
                url: `v1/admin/settings/school-timings`,
                method: 'GET',
                params: { gradeId, gender }
            }),
            providesTags: ["settings"],
        }),
        updateLibrarySettings: builder.mutation({
            query: ({id, librarySettings}) => ({
                url: `v1/admin/settings/${id}/library-settings`,
                method: 'PUT',
                body: { librarySettings }
            }),
            invalidatesTags: ["settings"],
        }),
        updateSchoolTimings: builder.mutation({
            query: ({id, schoolTimings}) => ({
                url: `v1/admin/settings/${id}/school-timings`,
                method: 'PUT',
                body: { schoolTimings }
            }),
            invalidatesTags: ["settings"],
        }),

    }),

});

export const { 
    useGetSettingQuery,
    useCreateSettingMutation,
    useUpdateSettingMutation,
    useGetSchoolTimingsQuery,
    useUpdateLibrarySettingsMutation,
    useUpdateSchoolTimingsMutation
} = settingsSlice