import { axiosInstance } from "../CustomAxios";


export const createSubject = async (data) => {
  try {
    const response = await axiosInstance.post('v1/admin/subject', data);
    return response
  } catch (error) {
    throw error
  }

}

export const updateSubject = async (data) => {
  try {
    const response = await axiosInstance.patch(`v1/admin/subject/${data?.id}`, data);
    return response
  } catch (error) {
    throw error
  }

}

export const getSubject = async () => {
  try {
    const response = await axiosInstance.get('v1/admin/subject');
    return response
  } catch (error) {
    throw error
  }

}

export const deleteSubject = async (id) => {
  try {
    const response = await axiosInstance.delete(`v1/admin/subject/${id}`);
    return response
  } catch (error) {
    throw error
  }

}