import { axiosInstance } from "../CustomAxios";


export const academicYearList = async () => {
    try {
      const response = await axiosInstance.get('admin/academic_list');
      return response
    } catch (error) {
      throw error
    }
  
  }