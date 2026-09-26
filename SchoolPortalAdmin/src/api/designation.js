import { axiosInstance } from "../CustomAxios";


export const createDesignation = async (data) => {
  try {
    const response = await axiosInstance.post('admin/designation_create', data);
    return response
  } catch (error) {
    throw error
  }

}

export const updateDesignation = async (data) => {
  try {
    const response = await axiosInstance.post('admin/designation_update', data);
    return response
  } catch (error) {
    throw error
  }
}

export const getDesignation = async () => {
  try {
    const response = await axiosInstance.get('admin/designation_list');
    return response
  } catch (error) {
    throw error
  }

}


export const deleteDesignation = async (id) => {
  try {
    const response = await axiosInstance.get(`admin/designation_list/${id}`);
    return response
  } catch (error) {
    throw error
  }

}