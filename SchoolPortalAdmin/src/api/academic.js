import { axiosInstance } from "../CustomAxios";


export const createAcademic = async (data) => {
  try {
    const response = await axiosInstance.post('v1/admin/academic', data);
    return response
  } catch (error) {
    throw error
  }

}


export const getAcademic = async () => {
  try {
    const response = await axiosInstance.get('v1/admin/academic');
    return response
  } catch (error) {
    throw error
  }

}

export const updateAcademic = async (data) => {

  try {
    const response = await axiosInstance.put(`v1/admin/academic/${data?.id}`, data);
    return response
  } catch (error) {
    throw error
  }

}
export const deleteAcademic = async (id) => {
  try {
    const response = await axiosInstance.delete(`v1/admin/academic/${id}`);
    return response
  } catch (error) {
    throw error
  }
}