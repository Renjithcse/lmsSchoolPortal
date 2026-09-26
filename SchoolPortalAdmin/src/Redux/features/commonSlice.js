import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../helpers/NetworkHelper";

export const commonSlice = createApi({
    reducerPath: "common",
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        getAcademicYear: builder.query({
            query: () => "v1/admin/academic",
        }),
        getAllGradesByAcademic: builder.query({
            query: (academicYear) => `v1/users/student/grades?academicYear=${academicYear}`,
        }),
        getAllSubjectsByAcademicYearGrade: builder.query({
            query: ({academic, grade}) => `v1/admin/grade_subject/uniquSubjects/${academic}/${grade}`,
        }),
        getAllSectionByAcademicYearGradeGender: builder.query({
            query: (params) => ({
                url: `v1/users/student/sections`,
                method: 'GET',
                params: params,
            }),
        }),
        getAllSubjectsByAcademicYearGradeGenderSection: builder.query({
            query: (params) => ({
                url: `v1/admin/grade_subject`,
                method: 'GET',
                params: params,
            })
        }),
        nationalityList : builder.query({
            query: () => ({
                url: `v1/admin/country`,
                method: 'GET'
            })
        }),
        religionList : builder.query({
            query: () => ({
                url: `/v1/admin/religion`,
                method: 'GET'
            })
        }),
        stateListBasedOnCountry: builder.query({
            query: (id) => ({
                url: `v1/admin/state/country/${id}`,
                method: 'GET'
            })
        }),
        cityBasedOnState: builder.query({
            query: (id) => ({
                url: `v1/admin/city/state/${id}`,
                method: 'GET'
            })
        })
    }),

});

export const { 
    useGetAcademicYearQuery,
    useLazyGetAllGradesByAcademicQuery,
    useLazyGetAllSubjectsByAcademicYearGradeQuery,
    useLazyGetAllSectionByAcademicYearGradeGenderQuery,
    useLazyGetAllSubjectsByAcademicYearGradeGenderSectionQuery,
    useNationalityListQuery,
    useReligionListQuery,
    useLazyStateListBasedOnCountryQuery,
    useLazyCityBasedOnStateQuery
} = commonSlice;