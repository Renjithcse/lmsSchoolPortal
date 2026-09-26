import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../../helpers/NetworkHelper';

export const studentInformationApiSlice = createApi({
	reducerPath: 'studentInformationApi',
	baseQuery: baseQueryWithReauth,
	tagTypes: ['StudentInformation'],
	endpoints: (builder) => ({
		getStudentInformationCategories: builder.query({
			query: () => 'v1/student/information/categories/overview',
			providesTags: ['StudentInformation']
		}),
		getRecentStudentInformation: builder.query({
			query: (limit = 5) => ({
				url: 'v1/student/information/recent',
				params: { limit }
			}),
			providesTags: ['StudentInformation']
		}),
		getUnreadInformationCount: builder.query({
			query: () => 'v1/student/information/unread/count',
			providesTags: ['StudentInformation']
		}),
		getAllStudentInformation: builder.query({
			query: (params = {}) => ({
				url: 'v1/student/information',
				params
			}),
			providesTags: (result) =>
				result?.data?.information
					? [
						...result.data.information.map(({ _id }) => ({ type: 'StudentInformation', id: _id })),
						{ type: 'StudentInformation', id: 'LIST' }
					]
					: [{ type: 'StudentInformation', id: 'LIST' }]
		}),
		getStudentInformationByCategory: builder.query({
			query: ({ category, params = {} }) => ({
				url: `v1/student/information/category/${encodeURIComponent(category)}`,
				params
			}),
			providesTags: (result) =>
				result?.data?.information
					? [
						...result.data.information.map(({ _id }) => ({ type: 'StudentInformation', id: _id })),
						{ type: 'StudentInformation', id: 'LIST' }
					]
					: [{ type: 'StudentInformation', id: 'LIST' }]
		}),
		getStudentInformation: builder.query({
			query: (id) => `v1/student/information/${id}`,
			providesTags: (result, error, id) => [{ type: 'StudentInformation', id }]
		}),
		searchStudentInformation: builder.query({
			query: (query) => ({
				url: 'v1/student/information/search',
				params: { q: query }
			}),
			providesTags: ['StudentInformation']
		})
	})
});

export const {
	useLazyGetAllStudentInformationQuery,
	useLazyGetStudentInformationByCategoryQuery,
	useGetStudentInformationCategoriesQuery,
	useGetRecentStudentInformationQuery,
	useGetUnreadInformationCountQuery,
	useGetStudentInformationQuery,
	useSearchStudentInformationQuery
} = studentInformationApiSlice;
