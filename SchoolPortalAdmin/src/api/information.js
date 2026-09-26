import { axiosInstance as CustomAxios } from '../CustomAxios';

// Admin Information API calls
export const createInformation = async (formData) => {
    const response = await CustomAxios.post('/v1/admin/information', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getAllInformation = async (params = {}) => {
    const response = await CustomAxios.get('/v1/admin/information', { params });
    return response.data;
};

export const getInformation = async (id) => {
    const response = await CustomAxios.get(`/v1/admin/information/${id}`);
    return response.data;
};

export const updateInformation = async (id, formData) => {
    const response = await CustomAxios.patch(`/v1/admin/information/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const deleteInformation = async (id) => {
    const response = await CustomAxios.delete(`/v1/admin/information/${id}`);
    return response.data;
};

export const removeAttachment = async (id, attachmentId) => {
    const response = await CustomAxios.delete(`/v1/admin/information/${id}/attachments/${attachmentId}`);
    return response.data;
};

export const getInformationByCategory = async (category, params = {}) => {
    const response = await CustomAxios.get(`/v1/admin/information/category/${encodeURIComponent(category)}`, { params });
    return response.data;
};

export const publishInformation = async (id) => {
    const response = await CustomAxios.patch(`/v1/admin/information/${id}/publish`);
    return response.data;
};

export const archiveInformation = async (id) => {
    const response = await CustomAxios.patch(`/v1/admin/information/${id}/archive`);
    return response.data;
};

export const getTargetAudienceCount = async (data) => {
    const response = await CustomAxios.post('/v1/admin/information/target-audience-count', data);
    return response.data;
};

export const getInformationStats = async () => {
    const response = await CustomAxios.get('/v1/admin/information/stats/dashboard');
    return response.data;
};

// Student Information API calls
export const getAllStudentInformation = async (params = {}) => {
    const response = await CustomAxios.get('/v1/student/information', { params });
    return response.data;
};

export const getStudentInformationByCategory = async (category, params = {}) => {
    const response = await CustomAxios.get(`/v1/student/information/category/${encodeURIComponent(category)}`, { params });
    return response.data;
};

export const getStudentInformationCategories = async () => {
    const response = await CustomAxios.get('/v1/student/information/categories/overview');
    return response.data;
};

export const getRecentStudentInformation = async (limit = 5) => {
    const response = await CustomAxios.get('/v1/student/information/recent', { 
        params: { limit } 
    });
    return response.data;
};

export const getUnreadInformationCount = async () => {
    const response = await CustomAxios.get('/v1/student/information/unread/count');
    return response.data;
};

export const searchStudentInformation = async (query) => {
    const response = await CustomAxios.get('/v1/student/information/search', { 
        params: { q: query } 
    });
    return response.data;
};

export const getStudentInformation = async (id) => {
    const response = await CustomAxios.get(`/v1/student/information/${id}`);
    return response.data;
};

export const downloadAttachment = async (id, attachmentId, filename) => {
    const response = await CustomAxios.get(`/v1/student/information/${id}/attachments/${attachmentId}/download`, {
        responseType: 'blob',
    });
    
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return response.data;
};

// Utility functions
export const getInformationCategories = () => {
    return [
        { value: 'Information Desk', label: 'Information Desk' },
        { value: 'Help Desk', label: 'Help Desk' },
        { value: 'General Information', label: 'General Information' }
    ];
};

export const getPublishToOptions = () => {
    return [
        { value: 'All Teachers', label: 'All Teachers' },
        { value: 'All Students', label: 'All Students' },
        { value: 'Both Teachers and Students', label: 'Both Teachers and Students' },
        { value: 'Specific Students', label: 'Specific Students' }
    ];
};

export const getTargetTypeOptions = () => {
    return [
        { value: 'All Students', label: 'All Students' },
        { value: 'Gender Wise', label: 'Gender Wise' },
        { value: 'Grade Wise', label: 'Grade Wise' },
        { value: 'Grade and Gender Wise', label: 'Grade and Gender Wise' },
        { value: 'Section Wise', label: 'Section Wise' }
    ];
};

export const getPriorityOptions = () => {
    return [
        { value: 'Low', label: 'Low', color: '#10b981' },
        { value: 'Medium', label: 'Medium', color: '#f59e0b' },
        { value: 'High', label: 'High', color: '#ef4444' },
        { value: 'Urgent', label: 'Urgent', color: '#dc2626' }
    ];
};

export const getStatusOptions = () => {
    return [
        { value: 'Draft', label: 'Draft', color: '#6b7280' },
        { value: 'Published', label: 'Published', color: '#10b981' },
        { value: 'Archived', label: 'Archived', color: '#9ca3af' }
    ];
};

export const getGenderOptions = () => {
    return [
        { value: 'Both', label: 'Both' },
        { value: 'Male', label: 'Male' },
        { value: 'Female', label: 'Female' }
    ];
};
