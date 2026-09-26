import { axiosInstance } from "../CustomAxios";


export const getStatebasedCountry = async (id) => {
  try {
    const response = await axiosInstance.get(`v1/admin/state/country/${id}`);
    return response
  } catch (error) {
    throw error
  }

}