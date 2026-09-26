import { axiosInstance } from "../CustomAxios";


export const createNationality = async (data) => {
  try {
    const response = await axiosInstance.post('admin/nationality_create', data);
    return response
  } catch (error) {
    throw error
  }

}

export const updateNationality = async (data) => {
  try {
    const response = await axiosInstance.post('admin/nationality_update', data);
    return response
  } catch (error) {
    throw error
  }

}

export const getNationality = async () => {
  try {
    const response = await axiosInstance.get('v1/admin/country');
    return response
  } catch (error) {
    throw error
  }

}

export const deleteNationality = async (id) => {
  try {
    const response = await axiosInstance.get(`admin/nationality_status_change/${id}`);
    return response
  } catch (error) {
    throw error
  }

}