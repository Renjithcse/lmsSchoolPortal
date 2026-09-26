import { axiosInstance } from "../CustomAxios";

// Admin APIs for managing subject notes

// Create a new subject note
export const createSubjectNote = async (formData) => {
  try {
    const response = await axiosInstance.post('v1/admin/subject-notes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Create multiple subject notes at once
export const createMultipleSubjectNotes = async (data) => {
  try {
    const response = await axiosInstance.post('v1/admin/subject-notes/batch', data);
    return response;
  } catch (error) {
    throw error;
  }
};

// Get all subject notes with optional filters
export const getAllSubjectNotes = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const response = await axiosInstance.get(`v1/admin/subject-notes?${queryParams.toString()}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Get a specific subject note by ID
export const getSubjectNote = async (id) => {
  try {
    const response = await axiosInstance.get(`v1/admin/subject-notes/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Update a subject note
export const updateSubjectNote = async (id, formData) => {
  try {
    const response = await axiosInstance.patch(`v1/admin/subject-notes/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Delete a subject note
export const deleteSubjectNote = async (id) => {
  try {
    const response = await axiosInstance.delete(`v1/admin/subject-notes/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Remove a specific document from a subject note
export const removeDocument = async (id, documentId) => {
  try {
    const response = await axiosInstance.delete(`v1/admin/subject-notes/${id}/documents/${documentId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Get available subjects for a specific class
export const getAvailableSubjects = async (params) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const response = await axiosInstance.get(`v1/admin/subject-notes/available-subjects?${queryParams.toString()}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Get subject notes by class and subject
export const getSubjectNotesByClass = async (params) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const response = await axiosInstance.get(`v1/admin/subject-notes/by-class?${queryParams.toString()}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Student APIs for viewing subject notes

// Get all subject notes for the authenticated student
export const getStudentSubjectNotes = async () => {
  try {
    const response = await axiosInstance.get('v1/student/subject-notes');
    return response;
  } catch (error) {
    throw error;
  }
};

// Get student's subjects with notes count
export const getStudentSubjectsWithNotes = async () => {
  try {
    const response = await axiosInstance.get('v1/student/subject-notes/subjects');
    return response;
  } catch (error) {
    throw error;
  }
};

// Get subject notes for a specific subject (student view)
export const getStudentSubjectNotesBySubject = async (subjectId) => {
  try {
    const response = await axiosInstance.get(`v1/student/subject-notes/subject/${subjectId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Get a specific subject note (student view with view tracking)
export const getStudentSubjectNote = async (id) => {
  try {
    const response = await axiosInstance.get(`v1/student/subject-notes/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Download a document from subject notes (student)
export const downloadDocument = async (id, documentId) => {
  try {
    const response = await axiosInstance.get(`v1/student/subject-notes/${id}/documents/${documentId}/download`, {
      responseType: 'blob', // Important for file downloads
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Publish subject note to multiple sections
export const publishSubjectNote = async (noteId, data) => {
  try {
    const response = await axiosInstance.post(`v1/admin/subject-notes/${noteId}/publish`, data);
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
    
    const response = await axiosInstance.get(`v1/admin/subject-notes/available-publish-sections?${queryParams.toString()}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Utility function to handle file download
export const handleFileDownload = (response, filename) => {
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
