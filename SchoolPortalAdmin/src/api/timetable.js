import { axiosInstance } from "../CustomAxios";

// Create a new timetable
export const createTimetable = async (data) => {
  try {
    const response = await axiosInstance.post('v1/admin/timetable', data);
    return response;
  } catch (error) {
    throw error;
  }
};

// Get all timetables with optional filters
export const getAllTimetables = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const response = await axiosInstance.get(`v1/admin/timetable?${queryParams.toString()}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Get a specific timetable by ID
export const getTimetable = async (id) => {
  try {
    const response = await axiosInstance.get(`v1/admin/timetable/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Update a timetable
export const updateTimetable = async (data) => {
  try {
    const response = await axiosInstance.patch(`v1/admin/timetable/${data.id}`, data);
    return response;
  } catch (error) {
    throw error;
  }
};

// Delete a timetable
export const deleteTimetable = async (id) => {
  try {
    const response = await axiosInstance.delete(`v1/admin/timetable/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Get available subjects and teachers for a specific class
export const getAvailableSubjectsAndTeachers = async (params) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const response = await axiosInstance.get(`v1/admin/timetable/available-subjects-teachers?${queryParams.toString()}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Get school timings for timetable creation
export const getSchoolTimingsForTimetable = async (params) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const response = await axiosInstance.get(`v1/admin/timetable/school-timings?${queryParams.toString()}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Generate timetable template
export const generateTimetableTemplate = async (params) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const response = await axiosInstance.get(`v1/admin/timetable/generate-template?${queryParams.toString()}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Get timetable by class (grade, gender, section, academic year, term)
export const getTimetableByClass = async (params) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const response = await axiosInstance.get(`v1/admin/timetable/by-class?${queryParams.toString()}`);
    return response;
  } catch (error) {
    throw error;
  }
};

