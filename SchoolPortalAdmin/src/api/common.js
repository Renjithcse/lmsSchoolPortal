import { axiosInstance } from "../CustomAxios";

export const getAllGradesByAcademic = async (data) => {
    try {
        const response = await axiosInstance.get(`v1/users/student/grades`, {
            params: data
        });
        return response?.data?.data
    } catch (error) {
        throw error
    }

}

export const getAllSectionsByGrade = async (data) => {
    try {
        const response = await axiosInstance.get(`v1/users/student/sections`, {
            params: data
        });
        return response?.data?.data
    } catch (error) {
        throw error
    }
}


export const getAllSubjectsByAcademicYearGrade = async (academicYear, grade) => {
    try {
        const response = await axiosInstance.get(`v1/admin/grade_subject/uniquSubjects/${academicYear}/${grade}`);
        return response?.data?.data
    } catch (error) {
        throw error
    }

}