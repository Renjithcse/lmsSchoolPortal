import { axiosInstance } from "../CustomAxios";


export const createReligion = async (data) => {
  try {
    const response = await axiosInstance.post('/v1/admin/religion', data);
    return response
  } catch (error) {
    throw error
  }

}

export const updateReligion = async (data) => {

  try {
    const response = await axiosInstance.put(`/v1/admin/religion/${data?.id}`, data);
    return response
  } catch (error) {
    throw error
  }

}

export const getReligion = async (id) => {
  try {
    const response = await axiosInstance.get(`/v1/admin/religion`);
    return response
  } catch (error) {
    throw error
  }

}
export const deleteReligion = async (id) => {
  try {
    const response = await axiosInstance.delete(`/v1/admin/religion/${id}`);
    return response
  } catch (error) {
    throw error
  }

}