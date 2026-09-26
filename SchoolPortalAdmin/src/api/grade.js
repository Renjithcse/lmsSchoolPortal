import { axiosInstance } from "../CustomAxios";


export const createGrade = async (data) => {
  try {
    const response = await axiosInstance.post('v1/admin/grade', data);
    return response
  } catch (error) {
    throw error
  }

}

export const updateGrade = async (data) => {
  try {
    const response = await axiosInstance.put(`v1/admin/grade/${data?.id}`, data);
    return response
  } catch (error) {
    throw error
  }

}

export const getGrade = async () => {
  try {
    const response = await axiosInstance.get('v1/admin/grade');
    return response
  } catch (error) {
    throw error
  }

}

export const deleteGrade = async (id) => {
  try {
    const response = await axiosInstance.delete(`v1/admin/grade/${id}`);
    return response
  } catch (error) {
    throw error
  }

}


