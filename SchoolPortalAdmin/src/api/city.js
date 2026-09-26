import { axiosInstance } from "../CustomAxios";


export const createCity = async (data) => {
  try {
    const response = await axiosInstance.post('admin/city_create', data);
    return response
  } catch (error) {
    throw error
  }

}

export const updateCity = async (data) => {
  try {
    const response = await axiosInstance.post('admin/city_update', data);
    return response
  } catch (error) {
    throw error
  }

}

export const getCityBasedOnCountry = async (id) => {
  try {
    const response = await axiosInstance.get(`v1/admin/city/country/${id}`);
    return response
  } catch (error) {
    throw error
  }

}
export const deleteCity = async (id) => {
  try {
    const response = await axiosInstance.get(`admin/city_list/${id}`);
    return response
  } catch (error) {
    throw error
  }

}