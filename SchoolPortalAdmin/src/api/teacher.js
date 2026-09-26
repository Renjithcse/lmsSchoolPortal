import { axiosInstance } from "../CustomAxios";


export const createTeacher = async (data) => {
  try {
    const response = await axiosInstance.post('v1/users/teacher', data);
    return response
  } catch (error) {
    throw error
  }

}

export const getTeacher = async () => {
  try {
    const response = await axiosInstance.get('v1/users/teacher');
    return response
  } catch (error) {
    throw error
  }

}

export const getTeacherSingle = async (id) => {
  try {
    const response = await axiosInstance.get(`v1/users/teacher/${id}`);
    return response
  } catch (error) {
    throw error
  }

}
export const updateTeacher = async (data) => {
  const { _id, ...rest } = data;

  try {
    const response = await axiosInstance.patch(`v1/users/teacher/${_id}`, rest);
    return response
  } catch (error) {
    throw error
  }

}

export const getTeacherDashboardStats = async () => {
  try {
    const response = await axiosInstance.get('v1/users/teacher/dashboard');
    return response?.data;
  } catch (error) {
    throw error
  }
}

export const getMyTeacherDashboardStats = async () => {
  try {
    const response = await axiosInstance.get('v1/users/teacher/dashboard/me');
    return response?.data;
  } catch (error) {
    throw error
  }
}