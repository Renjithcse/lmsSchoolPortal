import { axiosInstance } from "../CustomAxios";


export const createStudent = async (data) => {
  try {
    const response = await axiosInstance.post('v1/users/student/students', data);
    return response
  } catch (error) {
    throw error
  }

}
export const getAllStudent = async (data) => {
  try {
    const response = await axiosInstance.get(`v1/users/student/students?academicYear=${data?.academic_id}&grade=${data?.grade_id}&gender=${data?.gender}&section=${data?.section_id}`);
    return response
  } catch (error) {
    throw error
  }

}
export const getStudentSingle = async (id) => {
  try {
    const response = await axiosInstance.get(`v1/users/student/students/${id}`);
    return response
  } catch (error) {
    throw error
  }

}

export const updateStudent = async (data) => {
  const { _id, ...rest } = data;

  try {
    const response = await axiosInstance.put(`v1/users/student/students/${_id}`, rest);
    return response
  } catch (error) {
    throw error
  }

}

export const getStudentDashboardStats = async () => {
  try {
    const response = await axiosInstance.get('v1/users/student/dashboard');
    return response?.data;
  } catch (error) {
    throw error;
  }
}