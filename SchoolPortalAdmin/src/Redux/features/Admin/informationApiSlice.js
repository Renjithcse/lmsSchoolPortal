import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

// Define the API slice for information management
export const informationApiSlice = createApi({
    reducerPath: "informationApi",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["Information", "InformationStats", "TargetAudienceCount"],
    endpoints: (builder) => ({
        // Get all information with filters
        getAllInformation: builder.query({
            query: (params = {}) => ({
                url: "v1/admin/information",
                params,
            }),
            providesTags: (result) =>
                result?.data?.information
                    ? [
                        ...result.data.information.map(({ _id }) => ({ type: "Information", id: _id })),
                        { type: "Information", id: "LIST" },
                    ]
                    : [{ type: "Information", id: "LIST" }],
        }),

        // Get information by ID
        getInformation: builder.query({
            query: (id) => `v1/admin/information/${id}`,
            providesTags: (result, error, id) => [{ type: "Information", id }],
        }),

        // Get information by category
        getInformationByCategory: builder.query({
            query: ({ category, params = {} }) => ({
                url: `v1/admin/information/category/${encodeURIComponent(category)}`,
                params,
            }),
            providesTags: (result) =>
                result?.data?.information
                    ? [
                        ...result.data.information.map(({ _id }) => ({ type: "Information", id: _id })),
                        { type: "Information", id: "LIST" },
                    ]
                    : [{ type: "Information", id: "LIST" }],
        }),

        // Get information stats
        getInformationStats: builder.query({
            query: () => "v1/admin/information/stats/dashboard",
            providesTags: ["InformationStats"],
        }),

        // Create information
        createInformation: builder.mutation({
            query: (formData) => ({
                url: "v1/admin/information",
                method: "POST",
                body: formData,
            }),
            invalidatesTags: [{ type: "Information", id: "LIST" }, "InformationStats"],
        }),

        // Update information
        updateInformation: builder.mutation({
            query: ({ id, formData }) => ({
                url: `v1/admin/information/${id}`,
                method: "PATCH",
                body: formData,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "Information", id },
                { type: "Information", id: "LIST" },
            ],
        }),

        // Delete information
        deleteInformation: builder.mutation({
            query: (id) => ({
                url: `v1/admin/information/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, id) => [
                { type: "Information", id },
                { type: "Information", id: "LIST" },
                "InformationStats",
            ],
        }),

        // Remove attachment
        removeAttachment: builder.mutation({
            query: ({ id, attachmentId }) => ({
                url: `v1/admin/information/${id}/attachments/${attachmentId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "Information", id }],
        }),

        // Publish information
        publishInformation: builder.mutation({
            query: (id) => ({
                url: `v1/admin/information/${id}/publish`,
                method: "PATCH",
            }),
            invalidatesTags: (result, error, id) => [
                { type: "Information", id },
                { type: "Information", id: "LIST" },
                "InformationStats",
            ],
        }),

        // Archive information
        archiveInformation: builder.mutation({
            query: (id) => ({
                url: `v1/admin/information/${id}/archive`,
                method: "PATCH",
            }),
            invalidatesTags: (result, error, id) => [
                { type: "Information", id },
                { type: "Information", id: "LIST" },
                "InformationStats",
            ],
        }),

        // Get target audience count
        getTargetAudienceCount: builder.mutation({
            query: (data) => ({
                url: "v1/admin/information/target-audience-count",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["TargetAudienceCount"],
        }),

        // Student information queries
        getAllStudentInformation: builder.query({
            query: (params = {}) => ({
                url: "v1/student/information",
                params,
            }),
            providesTags: (result) =>
                result?.data?.information
                    ? [
                        ...result.data.information.map(({ _id }) => ({ type: "Information", id: _id })),
                        { type: "Information", id: "STUDENT_LIST" },
                    ]
                    : [{ type: "Information", id: "STUDENT_LIST" }],
        }),

        getStudentInformationByCategory: builder.query({
            query: ({ category, params = {} }) => ({
                url: `v1/student/information/category/${encodeURIComponent(category)}`,
                params,
            }),
            providesTags: (result) =>
                result?.data?.information
                    ? [
                        ...result.data.information.map(({ _id }) => ({ type: "Information", id: _id })),
                        { type: "Information", id: "STUDENT_LIST" },
                    ]
                    : [{ type: "Information", id: "STUDENT_LIST" }],
        }),

        getStudentInformation: builder.query({
            query: (id) => `v1/student/information/${id}`,
            providesTags: (result, error, id) => [{ type: "Information", id }],
        }),

        getStudentInformationCategories: builder.query({
            query: () => "v1/student/information/categories/overview",
            providesTags: ["Information"],
        }),

        getRecentStudentInformation: builder.query({
            query: (limit = 5) => ({
                url: "v1/student/information/recent",
                params: { limit },
            }),
            providesTags: ["Information"],
        }),

        getUnreadInformationCount: builder.query({
            query: () => "v1/student/information/unread/count",
            providesTags: ["Information"],
        }),

        searchStudentInformation: builder.query({
            query: (query) => ({
                url: "v1/student/information/search",
                params: { q: query },
            }),
            providesTags: ["Information"],
        }),

        downloadAttachment: builder.mutation({
            query: ({ id, attachmentId, filename }) => ({
                url: `v1/student/information/${id}/attachments/${attachmentId}/download`,
                responseType: "blob",
            }),
            async onQueryStarted({ filename }, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    
                    // Create blob link to download
                    const url = window.URL.createObjectURL(new Blob([data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', filename);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('Download failed:', error);
                }
            },
        }),
    }),
});

// Export hooks for usage in components
export const {
    useGetAllInformationQuery,
    useGetInformationQuery,
    useGetInformationByCategoryQuery,
    useGetInformationStatsQuery,
    useCreateInformationMutation,
    useUpdateInformationMutation,
    useDeleteInformationMutation,
    useRemoveAttachmentMutation,
    usePublishInformationMutation,
    useArchiveInformationMutation,
    useGetTargetAudienceCountMutation,
    useGetAllStudentInformationQuery,
    useGetStudentInformationByCategoryQuery,
    useGetStudentInformationQuery,
    useGetStudentInformationCategoriesQuery,
    useGetRecentStudentInformationQuery,
    useGetUnreadInformationCountQuery,
    useSearchStudentInformationQuery,
    useDownloadAttachmentMutation,
} = informationApiSlice;
