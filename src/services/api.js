import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  // Validate product key
  validateProductKey: (productKey) =>
    api.post('/auth/validate-product-key', { productKey }),

  // Register admin
  registerAdmin: (data) =>
    api.post('/auth/register-admin', data),

  // Login
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  // Get current user
  getMe: () =>
    api.get('/auth/me'),

  // Logout
  logout: () =>
    api.post('/auth/logout'),

  // Update password
  updatePassword: (currentPassword, newPassword) =>
    api.put('/auth/updatepassword', { currentPassword, newPassword }),
};

// User API calls
export const userAPI = {
  // Register staff
  registerStaff: (data) =>
    api.post('/users/register-staff', data),

  // Get all staff
  getStaff: () =>
    api.get('/users/staff'),

  // Get single staff member
  getStaffMember: (id) =>
    api.get(`/users/staff/${id}`),

  // Update staff
  updateStaff: (id, data) =>
    api.put(`/users/staff/${id}`, data),

  // Delete staff
  deleteStaff: (id) =>
    api.delete(`/users/staff/${id}`),

  // Get profile
  getProfile: () =>
    api.get('/users/profile'),

  // Update profile
  updateProfile: (data) =>
    api.put('/users/profile', data),
};

export default api;