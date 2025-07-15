import { create } from 'zustand';
import { authAPI } from '../services/api';


export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,

  // Initialize auth state from localStorage
  initialize: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        set({ user: parsedUser, isAuthenticated: true });
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },

  // Validate product key
  validateProductKey: async (productKey) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.validateProductKey(productKey);
      set({ loading: false });
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Product key validation failed';
      set({ loading: false, error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  // Register admin
  registerAdmin: async (userData) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.registerAdmin(userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, isAuthenticated: true, loading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      set({ loading: false, error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  // Login
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, isAuthenticated: true, loading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      set({ loading: false, error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, error: null });
  },

  // Get current user
  getCurrentUser: async () => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.getMe();
      const user = response.data.user;
      
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, loading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to get user data';
      set({ loading: false, error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  // Update password
  updatePassword: async (currentPassword, newPassword) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.updatePassword(currentPassword, newPassword);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, loading: false });
      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password update failed';
      set({ loading: false, error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));