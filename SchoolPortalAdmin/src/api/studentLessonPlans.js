import { axiosInstance } from '../CustomAxios';

const baseUrl = 'v1/student/lesson-plans';

export const getStudentLessonPlanSubjects = async () => {
  try {
    const response = await axiosInstance.get(`${baseUrl}/subjects`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getStudentLessonPlansBySubject = async (subjectId) => {
  try {
    const response = await axiosInstance.get(`${baseUrl}/subject/${subjectId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getStudentLessonPlanDetail = async (planId) => {
  try {
    const response = await axiosInstance.get(`${baseUrl}/${planId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};












