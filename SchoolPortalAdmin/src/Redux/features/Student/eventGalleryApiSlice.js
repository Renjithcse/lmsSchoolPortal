import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../../helpers/NetworkHelper';

export const studentEventGalleryApiSlice = createApi({
	reducerPath: 'studentEventGalleryApi',
	baseQuery: baseQueryWithReauth,
	tagTypes: ['StudentEventGallery'],
	endpoints: (builder) => ({
		getAllStudentEventGalleries: builder.query({
			query: (params = {}) => ({
				url: 'v1/student/event-gallery',
				method: 'GET',
				params,
			}),
			providesTags: ['StudentEventGallery'],
		}),
		getStudentEventGalleryById: builder.query({
			query: (id) => ({
				url: `v1/student/event-gallery/${id}`,
				method: 'GET',
			}),
			providesTags: (result, error, id) => [{ type: 'StudentEventGallery', id }],
		}),
	}),
});

export const {
	useGetAllStudentEventGalleriesQuery,
	useGetStudentEventGalleryByIdQuery,
} = studentEventGalleryApiSlice;
