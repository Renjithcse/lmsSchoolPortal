import { axiosInstance } from "../CustomAxios";


export const createSection = async (data) => {
  try {
    const response = await axiosInstance.post('v1/admin/section', data);
    return response
  } catch (error) {
    throw error
  }

}

export const updateSection = async (data) => {
  const { id, ...rest } = data;
  try {
    const response = await axiosInstance.patch(`v1/admin/section/${id}`, rest);
    return response
  } catch (error) {
    throw error
  }

}

export const getSection = async () => {
  try {
    const response = await axiosInstance.get('v1/admin/section');
    return response
  } catch (error) {
    throw error
  }

}
export const deleteSection = async (id) => {
  try {
    const response = await axiosInstance.delete(`v1/admin/section/${id}`);
    return response
  } catch (error) {
    throw error
  }

}