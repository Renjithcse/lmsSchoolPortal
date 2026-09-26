import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../../helpers/NetworkHelper';

export const eventGallerySlice = createApi({
	reducerPath: 'eventGallerySlice',
	baseQuery: baseQueryWithReauth,
	tagTypes: ['EventGallery'],
	endpoints: (builder) => ({
		getAllEventGalleries: builder.query({
			query: () => ({
				url: `v1/admin/event-gallery`,
				method: 'GET',
			}),
			providesTags: ['EventGallery'],
		}),
		getEventGalleryById: builder.query({
			query: (id) => ({
				url: `v1/admin/event-gallery/${id}`,
				method: 'GET',
			}),
			providesTags: ['EventGallery'],
		}),
		createEventGallery: builder.mutation({
			query: (data) => ({
				url: `v1/admin/event-gallery`,
				method: 'POST',
				body: data,
			}),
			invalidatesTags: ['EventGallery'],
		}),
		updateEventGallery: builder.mutation({
			query: ({ id, data }) => ({
				url: `v1/admin/event-gallery/${id}`,
				method: 'PATCH',
				body: data,
			}),
			invalidatesTags: ['EventGallery'],
		}),
		deleteEventGallery: builder.mutation({
			query: (id) => ({
				url: `v1/admin/event-gallery/${id}`,
				method: 'DELETE',
			}),
			invalidatesTags: ['EventGallery'],
		}),
		publishEventGallery: builder.mutation({
			query: ({ id, data }) => ({
				url: `v1/admin/event-gallery/${id}/publish`,
				method: 'PATCH',
				body: data,
			}),
			invalidatesTags: ['EventGallery'],
		}),
		unpublishEventGallery: builder.mutation({
			query: (id) => ({
				url: `v1/admin/event-gallery/${id}/unpublish`,
				method: 'PATCH',
			}),
			invalidatesTags: ['EventGallery'],
		}),
	}),
});

export const {
	useGetAllEventGalleriesQuery,
	useGetEventGalleryByIdQuery,
	useCreateEventGalleryMutation,
	useUpdateEventGalleryMutation,
	useDeleteEventGalleryMutation,
	usePublishEventGalleryMutation,
	useUnpublishEventGalleryMutation,
} = eventGallerySlice;
