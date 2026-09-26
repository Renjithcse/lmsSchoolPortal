import { axiosInstance } from "../CustomAxios";

const baseUrl = 'v1/admin/lesson-plans';

export const createLessonPlan = async (data) => {
  try {
    const response = await axiosInstance.post(baseUrl, data);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getLessonPlans = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        if (Array.isArray(params[key])) {
          params[key].forEach((value) => queryParams.append(key, value));
        } else {
          queryParams.append(key, params[key]);
        }
      }
    });
    const response = await axiosInstance.get(`${baseUrl}?${queryParams.toString()}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getLessonPlan = async (id) => {
  try {
    const response = await axiosInstance.get(`${baseUrl}/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateLessonPlan = async (id, data) => {
  try {
    const response = await axiosInstance.patch(`${baseUrl}/${id}`, data);
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateLessonPlanStatus = async (id, data) => {
  try {
    const response = await axiosInstance.patch(`${baseUrl}/${id}/status`, data);
    return response;
  } catch (error) {
    throw error;
  }
};

export const deleteLessonPlan = async (id) => {
  try {
    const response = await axiosInstance.delete(`${baseUrl}/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getLessonPlanAvailableSubjects = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    const response = await axiosInstance.get(`${baseUrl}/available-subjects?${queryParams.toString()}`);
    return response;
  } catch (error) {
    throw error;
  }
};












