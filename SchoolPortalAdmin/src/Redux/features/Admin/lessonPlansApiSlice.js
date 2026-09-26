import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../../helpers/NetworkHelper';

export const lessonPlansApiSlice = createApi({
    reducerPath: 'lessonPlansApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['LessonPlan', 'Chapter', 'LessonPlanProgress'],
    endpoints: (builder) => ({
        getLessonPlans: builder.query({
            query: (params = {}) => ({
                url: 'v1/admin/lesson-plans',
                params,
            }),
            providesTags: (result) =>
                result?.data?.length
                    ? [
                        ...result.data.map(({ _id }) => ({ type: 'LessonPlan', id: _id })),
                        { type: 'LessonPlan', id: 'LIST' },
                    ]
                    : [{ type: 'LessonPlan', id: 'LIST' }],
        }),
        getLessonPlan: builder.query({
            query: (id) => `v1/admin/lesson-plans/${id}`,
            providesTags: (result, error, id) => [{ type: 'LessonPlan', id }],
        }),
        getLessonPlanPublishedProgress: builder.query({
            query: (id) => `v1/admin/lesson-plans/${id}/published-progress`,
            providesTags: (result, error, id) => [{ type: 'LessonPlanProgress', id }],
        }),
        createLessonPlan: builder.mutation({
            query: (data) => ({
                url: 'v1/admin/lesson-plans',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'LessonPlan', id: 'LIST' }],
        }),
        updateLessonPlan: builder.mutation({
            query: ({ id, data }) => ({
                url: `v1/admin/lesson-plans/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'LessonPlan', id },
                { type: 'LessonPlan', id: 'LIST' },
            ],
        }),
        updateLessonPlanPublishedProgress: builder.mutation({
            query: ({ id, data }) => ({
                url: `v1/admin/lesson-plans/${id}/published-progress`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'LessonPlanProgress', id },
                { type: 'LessonPlan', id },
                { type: 'LessonPlan', id: 'LIST' },
            ],
        }),
        updateLessonPlanStatus: builder.mutation({
            query: ({ id, data }) => ({
                url: `v1/admin/lesson-plans/${id}/status`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'LessonPlan', id },
                { type: 'LessonPlan', id: 'LIST' },
            ],
        }),
        deleteLessonPlan: builder.mutation({
            query: (id) => ({
                url: `v1/admin/lesson-plans/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'LessonPlan', id },
                { type: 'LessonPlan', id: 'LIST' },
            ],
        }),
        getChapters: builder.query({
            query: (params = {}) => ({
                url: 'v1/admin/chapters',
                params,
            }),
            providesTags: (result) =>
                result?.data?.length
                    ? [
                        ...result.data.map(({ _id }) => ({ type: 'Chapter', id: _id })),
                        { type: 'Chapter', id: 'LIST' },
                    ]
                    : [{ type: 'Chapter', id: 'LIST' }],
        }),
        getChapter: builder.query({
            query: (id) => `v1/admin/chapters/${id}`,
            providesTags: (result, error, id) => [{ type: 'Chapter', id }],
        }),
        createChapter: builder.mutation({
            query: (data) => ({
                url: 'v1/admin/chapters',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'Chapter', id: 'LIST' }],
        }),
        deleteChapter: builder.mutation({
            query: (id) => ({
                url: `v1/admin/chapters/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Chapter', id },
                { type: 'Chapter', id: 'LIST' },
            ],
        }),
        publishChapter: builder.mutation({
            query: ({ chapterId, data }) => ({
                url: `v1/admin/chapters/${chapterId}/publish`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'Chapter', id: 'LIST' }],
        }),
        getAvailablePublishSections: builder.query({
            query: (params = {}) => ({
                url: 'v1/admin/chapters/available-publish-sections',
                params,
            }),
        }),
        getLessonPlanAvailableSubjects: builder.query({
            query: (params = {}) => ({
                url: 'v1/admin/lesson-plans/available-subjects',
                params,
            }),
        }),
    }),
});

export const {
    useGetLessonPlansQuery,
    useGetLessonPlanQuery,
    useGetLessonPlanPublishedProgressQuery,
    useCreateLessonPlanMutation,
    useUpdateLessonPlanMutation,
    useUpdateLessonPlanPublishedProgressMutation,
    useUpdateLessonPlanStatusMutation,
    useDeleteLessonPlanMutation,
    useLazyGetLessonPlanAvailableSubjectsQuery,
    useGetChaptersQuery,
    useGetChapterQuery,
    useCreateChapterMutation,
    useDeleteChapterMutation,
    usePublishChapterMutation,
    useLazyGetAvailablePublishSectionsQuery
} = lessonPlansApiSlice;
