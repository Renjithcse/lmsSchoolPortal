import { axiosInstance } from "../CustomAxios";

// Get comprehensive user details including academic history
export const getUserDetails = async (userId) => {
  try {
    const response = await axiosInstance.get(`v1/user/details/${userId}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Get my profile (current user)
export const getMyProfile = async () => {
  try {
    const response = await axiosInstance.get('v1/user/profile');
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Update my profile
export const updateMyProfile = async (profileData) => {
  try {
    const response = await axiosInstance.patch('v1/user/profile', profileData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get student academic history
export const getStudentAcademicHistory = async (studentId) => {
  try {
    const response = await axiosInstance.get(`v1/user/student/${studentId}/academic-history`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Get user statistics
export const getUserStats = async (userId) => {
  try {
    const response = await axiosInstance.get(`v1/user/stats/${userId}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Get all users by role
export const getUsersByRole = async (role) => {
  try {
    const response = await axiosInstance.get(`v1/user/all?role=${role}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const response = await axiosInstance.get(`v1/user/${userId}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
}; 