import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const academicSlice = createApi({
    reducerPath: "academicSlice",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["academics"],
    endpoints: (builder) => ({
        listAcademicYears: builder.query({
            query: () => ({
                url: `v1/admin/academic`,
                method: 'GET',
            }),
            providesTags: ["academics"],
        }),
        getAcademicYearById: builder.query({
            query: (id) => ({
                url: `v1/admin/academic/${id}`,
                method: 'GET',
            }),
            providesTags: ["academics"],
        }),
        createAcademicYear: builder.mutation({
            query: (data) => ({
                url: `v1/admin/academic`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["academics"],
        }),
        updateAcademicYear: builder.mutation({
            query: ({ id, data }) => ({
                url: `v1/admin/academic/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["academics"],
        }),
        deleteAcademicYear: builder.mutation({
            query: (id) => ({
                url: `v1/admin/academic/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ["academics"],
        }),
    }),
});

export const {
    useListAcademicYearsQuery,
    useGetAcademicYearByIdQuery,
    useCreateAcademicYearMutation,
    useUpdateAcademicYearMutation,
    useDeleteAcademicYearMutation,
} = academicSlice;
