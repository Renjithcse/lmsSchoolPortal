import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../../helpers/NetworkHelper';

export const timetableApiSlice = createApi({
  reducerPath: 'timetableApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Timetable', 'Timetables', 'TimetableMeta'],
  endpoints: (builder) => ({
    getAllTimetables: builder.query({
      query: (params = {}) => ({
        url: 'v1/admin/timetable',
        params,
      }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Timetable', id: _id })),
              { type: 'Timetables', id: 'LIST' },
            ]
          : [{ type: 'Timetables', id: 'LIST' }],
    }),
    getTimetable: builder.query({
      query: (id) => `v1/admin/timetable/${id}`,
      providesTags: (result, error, id) => [{ type: 'Timetable', id }],
    }),
    createTimetable: builder.mutation({
      query: (data) => ({
        url: 'v1/admin/timetable',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Timetables', id: 'LIST' }],
    }),
    updateTimetable: builder.mutation({
      query: ({ id, data }) => ({
        url: `v1/admin/timetable/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Timetable', id },
        { type: 'Timetables', id: 'LIST' },
      ],
    }),
    deleteTimetable: builder.mutation({
      query: (id) => ({
        url: `v1/admin/timetable/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Timetable', id },
        { type: 'Timetables', id: 'LIST' },
      ],
    }),
    getAvailableSubjectsAndTeachers: builder.query({
      query: (params = {}) => ({
        url: 'v1/admin/timetable/available-subjects-teachers',
        params,
      }),
      providesTags: ['TimetableMeta'],
    }),
    getSchoolTimingsForTimetable: builder.query({
      query: (params = {}) => ({
        url: 'v1/admin/timetable/school-timings',
        params,
      }),
      providesTags: ['TimetableMeta'],
    }),
    generateTimetableTemplate: builder.query({
      query: (params = {}) => ({
        url: 'v1/admin/timetable/generate-template',
        params,
      }),
    }),
    getTimetableByClass: builder.query({
      query: (params = {}) => ({
        url: 'v1/admin/timetable/by-class',
        params,
      }),
      providesTags: ['TimetableMeta'],
    }),
  }),
});

export const {
  useGetAllTimetablesQuery,
  useGetTimetableQuery,
  useCreateTimetableMutation,
  useUpdateTimetableMutation,
  useDeleteTimetableMutation,
  useLazyGetAvailableSubjectsAndTeachersQuery,
  useLazyGetSchoolTimingsForTimetableQuery,
  useLazyGenerateTimetableTemplateQuery,
  useLazyGetTimetableByClassQuery,
} = timetableApiSlice;
