import { axiosInstance } from "../CustomAxios";


export const createGradeSubject = async (data) => {
  try {
    const response = await axiosInstance.post('admin/gradeSubject_create', data);
    return response
  } catch (error) {
    throw error
  }

}
export const getGradeSubject = async () => {
  try {
    const response = await axiosInstance.get('admin/gradeSubject_subject');
    return response
  } catch (error) {
    throw error
  }

}



export const creategradeSubject = async (data) => {
  try {
    const response = await axiosInstance.post('admin/gradeSubject_create', data);
    return response
  } catch (error) {
    throw error
  }

}

export const editGradeSubject = async (data) => {
  try {
    const response = await axiosInstance.post('admin/gradeSubject_update', data);
    return response
  } catch (error) {
    throw error
  }

}

