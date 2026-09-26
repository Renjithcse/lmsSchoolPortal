import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../../helpers/NetworkHelper';

export const subjectNotesApiSlice = createApi({
    reducerPath: 'subjectNotesApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['SubjectNote', 'SubjectNotes'],
    endpoints: (builder) => ({
        getSubjectNotes: builder.query({
            query: (params = {}) => ({
                url: 'v1/admin/subject-notes',
                params,
            }),
            providesTags: (result) =>
                result?.data?.length
                    ? [
                        ...result.data.map(({ _id }) => ({ type: 'SubjectNote', id: _id })),
                        { type: 'SubjectNotes', id: 'LIST' },
                    ]
                    : [{ type: 'SubjectNotes', id: 'LIST' }],
        }),
        getSubjectNote: builder.query({
            query: (id) => `v1/admin/subject-notes/${id}`,
            providesTags: (result, error, id) => [{ type: 'SubjectNote', id }],
        }),
        createSubjectNote: builder.mutation({
            query: (data) => ({
                url: 'v1/admin/subject-notes',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'SubjectNotes', id: 'LIST' }],
        }),
        createMultipleSubjectNotes: builder.mutation({
            query: (data) => ({
                url: 'v1/admin/subject-notes/batch',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'SubjectNotes', id: 'LIST' }],
        }),
        updateSubjectNote: builder.mutation({
            query: ({ id, formData }) => ({
                url: `v1/admin/subject-notes/${id}`,
                method: 'PATCH',
                body: formData,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'SubjectNote', id },
                { type: 'SubjectNotes', id: 'LIST' },
            ],
        }),
        deleteSubjectNote: builder.mutation({
            query: (id) => ({
                url: `v1/admin/subject-notes/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'SubjectNote', id },
                { type: 'SubjectNotes', id: 'LIST' },
            ],
        }),
        removeDocument: builder.mutation({
            query: ({ id, documentId }) => ({
                url: `v1/admin/subject-notes/${id}/documents/${documentId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'SubjectNote', id },
                { type: 'SubjectNotes', id: 'LIST' },
            ],
        }),
        getAvailableSubjects: builder.query({
            query: (params = {}) => ({
                url: 'v1/admin/subject-notes/available-subjects',
                params,
            }),
        }),
        getSubjectNotesByClass: builder.query({
            query: (params = {}) => ({
                url: 'v1/admin/subject-notes/by-class',
                params,
            }),
        }),
        publishSubjectNote: builder.mutation({
            query: ({ noteId, data }) => ({
                url: `v1/admin/subject-notes/${noteId}/publish`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'SubjectNotes', id: 'LIST' }],
        }),
        getAvailablePublishSections: builder.query({
            query: (params = {}) => ({
                url: 'v1/admin/subject-notes/available-publish-sections',
                params,
            }),
        }),
    }),
});

export const {
    useGetSubjectNotesQuery,
    useGetSubjectNoteQuery,
    useCreateSubjectNoteMutation,
    useCreateMultipleSubjectNotesMutation,
    useUpdateSubjectNoteMutation,
    useDeleteSubjectNoteMutation,
    useRemoveDocumentMutation,
    useLazyGetAvailableSubjectsQuery,
    useGetSubjectNotesByClassQuery,
    usePublishSubjectNoteMutation,
    useLazyGetAvailablePublishSectionsQuery,
} = subjectNotesApiSlice;
