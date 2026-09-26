import { axiosInstance } from "../CustomAxios";


export const PostLogin = async (data) => {
  try {
    const response = await axiosInstance.post('v1/auth/login', data);
    return response
  } catch (error) {
    throw error
  }

}