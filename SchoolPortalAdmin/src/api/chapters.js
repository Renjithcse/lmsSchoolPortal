import { axiosInstance } from "../CustomAxios";

// Admin APIs for managing chapters

// Create a new chapter
export const createChapter = async (data) => {
  try {
    const response = await axiosInstance.post('v1/admin/chapters', data);
    return response;
  } catch (error) {
    throw error;
  }
};

// Get all chapters with optional filters
export const getAllChapters = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const response = await axiosInstance.get(`v1/admin/chapters?${queryParams.toString()}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Get a specific chapter by ID
export const getChapter = async (id) => {
  try {
    const response = await axiosInstance.get(`v1/admin/chapters/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Update a chapter
export const updateChapter = async (id, data) => {
  try {
    const response = await axiosInstance.patch(`v1/admin/chapters/${id}`, data);
    return response;
  } catch (error) {
    throw error;
  }
};

// Delete a chapter
export const deleteChapter = async (id) => {
  try {
    const response = await axiosInstance.delete(`v1/admin/chapters/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Get available subjects for chapters based on grade
export const getAvailableSubjects = async (params) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const response = await axiosInstance.get(`v1/admin/chapters/available-subjects?${queryParams.toString()}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Publish chapter to multiple sections
export const publishChapter = async (chapterId, data) => {
  try {
    const response = await axiosInstance.post(`v1/admin/chapters/${chapterId}/publish`, data);
    return response;
  } catch (error) {
    throw error;
  }
};

// Get available sections for publishing
export const getAvailablePublishSections = async (params) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const response = await axiosInstance.get(`v1/admin/chapters/available-publish-sections?${queryParams.toString()}`);
    return response;
  } catch (error) {
    throw error;
  }
};
