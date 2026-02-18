import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('admin');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Owners API
export const ownersAPI = {
  getAll: () => api.get('/owners/all'),
  get: (params) => api.get('/owners', { params }),
  getById: (id) => api.get(`/owners/${id}`),
  create: (data) => api.post('/owners', data),
  update: (id, data) => api.put(`/owners/${id}`, data),
  delete: (id) => api.delete(`/owners/${id}`),
};

// Tenants API
export const tenantsAPI = {
  getAll: () => api.get('/tenants/all'),
  get: (params) => api.get('/tenants', { params }),
  getById: (id) => api.get(`/tenants/${id}`),
  create: (data) => api.post('/tenants', data),
  update: (id, data) => api.put(`/tenants/${id}`, data),
  delete: (id) => api.delete(`/tenants/${id}`),
};

// Notices API
export const noticesAPI = {
  get: (params) => api.get('/notices', { params }),
  getById: (id) => api.get(`/notices/${id}`),
  create: (data) => api.post('/notices', data),
  update: (id, data) => api.put(`/notices/${id}`, data),
  delete: (id) => api.delete(`/notices/${id}`),
};

// Agreements API
export const agreementsAPI = {
  get: (params) => api.get('/agreements', { params }),
  getById: (id) => api.get(`/agreements/${id}`),
  create: (data) => api.post('/agreements', data),
  update: (id, data) => api.put(`/agreements/${id}`, data),
  delete: (id) => api.delete(`/agreements/${id}`),
};

// Police Verifications API
export const policeVerificationsAPI = {
  get: (params) => api.get('/police-verifications', { params }),
  getById: (id) => api.get(`/police-verifications/${id}`),
  create: (data) => api.post('/police-verifications', data),
  update: (id, data) => api.put(`/police-verifications/${id}`, data),
  delete: (id) => api.delete(`/police-verifications/${id}`),
};

// Payments API
export const paymentsAPI = {
  get: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
  getMonthlyTotal: (month) => api.get('/payments/monthly-total', { params: { month } }),
};

// Expenses API
export const expensesAPI = {
  get: (params) => api.get('/expenses', { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  getMonthlyTotal: (month) => api.get('/expenses/monthly-total', { params: { month } }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;
