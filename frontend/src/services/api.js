import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    getMe: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout')
};

// Submission APIs
export const submissionAPI = {
    getMySubmissions: () => api.get('/submissions'),
    getSubmission: (id) => api.get(`/submissions/${id}`),
    createSubmission: (data) => api.post('/submissions', data),
    updateSubmission: (id, data) => api.put(`/submissions/${id}`, data),
    submitForReview: (id) => api.post(`/submissions/${id}/submit`),
    deleteSubmission: (id) => api.delete(`/submissions/${id}`),
    uploadDocument: (id, formData) => api.post(`/submissions/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    deleteDocument: (id, docId) => api.delete(`/submissions/${id}/documents/${docId}`),
    downloadDocument: (docId) => api.get(`/submissions/documents/${docId}/download`, {
        responseType: 'blob'
    })
};

// Review APIs
export const reviewAPI = {
    getCoordinatorQueue: () => api.get('/reviews/coordinator/queue'),
    coordinatorApprove: (id) => api.post(`/reviews/coordinator/submissions/${id}/approve`),
    coordinatorReject: (id, reason) => api.post(`/reviews/coordinator/submissions/${id}/reject`, { reason }),
    getDeputyDeanQueue: () => api.get('/reviews/dean/queue'),
    deputyDeanEndorse: (id) => api.post(`/reviews/dean/submissions/${id}/endorse`),
    deputyDeanReject: (id, reason) => api.post(`/reviews/dean/submissions/${id}/reject`, { reason }),
    getAllSubmissions: () => api.get('/reviews/dashboard/submissions')
};

// Admin APIs
export const adminAPI = {
    // Users
    getUsers: () => api.get('/admin/users'),
    createUser: (data) => api.post('/admin/users', data),
    updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    grantPrivilege: (id, privilege) => api.post(`/admin/users/${id}/privileges`, { privilege }),
    revokePrivilege: (id, privilege) => api.delete(`/admin/users/${id}/privileges/${privilege}`),
    
    // Sessions
    getSessions: () => api.get('/admin/sessions'),
    createSession: (data) => api.post('/admin/sessions', data),
    updateSession: (id, data) => api.put(`/admin/sessions/${id}`, data),
    deleteSession: (id) => api.delete(`/admin/sessions/${id}`),
    
    // Departments
    getDepartments: () => api.get('/admin/departments'),
    createDepartment: (data) => api.post('/admin/departments', data),
    updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data),
    deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),
    
    // Courses
    getCourses: () => api.get('/admin/courses'),
    createCourse: (data) => api.post('/admin/courses', data),
    updateCourse: (id, data) => api.put(`/admin/courses/${id}`, data),
    deleteCourse: (id) => api.delete(`/admin/courses/${id}`),
    
    // Course Role Mappings
    getCourseRoleMappings: () => api.get('/admin/course-roles'),
    saveCourseRoleMapping: (data) => api.post('/admin/course-roles', data),
    deleteCourseRoleMapping: (id) => api.delete(`/admin/course-roles/${id}`),
    
    // Audit Logs
    getAuditLogs: (limit = 100) => api.get(`/admin/audit-logs?limit=${limit}`)
};

export default api;

