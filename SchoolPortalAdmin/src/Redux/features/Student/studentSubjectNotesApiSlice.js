import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../../helpers/NetworkHelper';

export const studentSubjectNotesApiSlice = createApi({
  reducerPath: 'studentSubjectNotesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['StudentSubjectNotes', 'StudentSubjectSubjects'],
  endpoints: (builder) => ({
    getStudentSubjectsWithNotes: builder.query({
      query: () => 'v1/student/subject-notes/subjects',
      providesTags: ['StudentSubjectSubjects']
    }),
    getStudentSubjectNotes: builder.query({
      query: () => 'v1/student/subject-notes',
      providesTags: (result) =>
        result?.data?.notesBySubject
          ? [
              ...result.data.notesBySubject.map((group) => ({
                type: 'StudentSubjectNotes',
                id: group.subject._id
              })),
              { type: 'StudentSubjectNotes', id: 'ALL' }
            ]
          : [{ type: 'StudentSubjectNotes', id: 'ALL' }]
    }),
    getStudentSubjectNotesBySubject: builder.query({
      query: (subjectId) => `v1/student/subject-notes/subject/${subjectId}`,
      providesTags: (result, error, subjectId) => [{ type: 'StudentSubjectNotes', id: subjectId }]
    }),
    getStudentSubjectNote: builder.query({
      query: (id) => `v1/student/subject-notes/${id}`,
      providesTags: (result, error, id) => [{ type: 'StudentSubjectNotes', id }]
    }),
    downloadSubjectNoteDocument: builder.mutation({
      query: ({ id, documentId }) => ({
        url: `v1/student/subject-notes/${id}/documents/${documentId}/download`,
        responseHandler: 'blob'
      })
    })
  })
});

export const {
  useGetStudentSubjectsWithNotesQuery,
  useLazyGetStudentSubjectNotesQuery,
  useLazyGetStudentSubjectNotesBySubjectQuery,
  useLazyGetStudentSubjectNoteQuery,
  useDownloadSubjectNoteDocumentMutation
} = studentSubjectNotesApiSlice;
