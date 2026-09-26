import { axiosInstance } from "../CustomAxios";

// Create a new term history
export const createTermHistory = async (data) => {
  try {
    const response = await axiosInstance.post('v1/admin/term-history', data);
    return response;
  } catch (error) {
    throw error;
  }
};

// Get all term histories with optional filters
export const getTermHistories = async (params = {}) => {
  try {
    const response = await axiosInstance.get('v1/admin/term-history', { params });
    return response;
  } catch (error) {
    throw error;
  }
};

// Get a single term history by ID
export const getTermHistoryById = async (id) => {
  try {
    const response = await axiosInstance.get(`v1/admin/term-history/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Update a term history
export const updateTermHistory = async (data) => {
  try {
    const response = await axiosInstance.put(`v1/admin/term-history/${data?.id}`, data);
    return response;
  } catch (error) {
    throw error;
  }
};

// Delete a term history
export const deleteTermHistory = async (id) => {
  try {
    const response = await axiosInstance.delete(`v1/admin/term-history/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Set term as active
export const setActiveTerm = async (id) => {
  try {
    const response = await axiosInstance.patch(`v1/admin/term-history/${id}/activate`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Get active term
export const getActiveTerm = async () => {
  try {
    const response = await axiosInstance.get('v1/admin/term-history/active/current');
    return response;
  } catch (error) {
    throw error;
  }
};

// Get current term (based on date)
export const getCurrentTerm = async () => {
  try {
    const response = await axiosInstance.get('v1/admin/term-history/current/date');
    return response;
  } catch (error) {
    throw error;
  }
};

// Get terms by academic year
export const getTermsByAcademicYear = async (academicYearId) => {
  try {
    const response = await axiosInstance.get(`v1/admin/term-history/academic-year/${academicYearId}`);
    return response;
  } catch (error) {
    throw error;
  }
};
