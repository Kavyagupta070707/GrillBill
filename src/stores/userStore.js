import { create } from 'zustand';
import { userAPI } from '../services/api';

export const useUserStore = create((set, get) => ({
  staff: [],
  currentStaff: null,
  loading: false,
  error: null,

  // Register staff member
  registerStaff: async (staffData) => {
    set({ loading: true, error: null });
    try {
      const response = await userAPI.registerStaff(staffData);
      
      // Refresh staff list
      await get().getStaff();
      
      set({ loading: false });
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Staff registration failed';
      set({ loading: false, error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  // Get all staff
  getStaff: async () => {
    set({ loading: true, error: null });
    try {
      const response = await userAPI.getStaff();
      set({ staff: response.data.staff, loading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch staff';
      set({ loading: false, error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  // Get single staff member
  getStaffMember: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await userAPI.getStaffMember(id);
      set({ currentStaff: response.data.staff, loading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch staff member';
      set({ loading: false, error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  // Update staff member
  updateStaff: async (id, staffData) => {
    set({ loading: true, error: null });
    try {
      const response = await userAPI.updateStaff(id, staffData);
      
      // Update staff in the list
      const updatedStaff = get().staff.map(member => 
        member._id === id ? response.data.staff : member
      );
      
      set({ staff: updatedStaff, loading: false });
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Staff update failed';
      set({ loading: false, error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  // Delete staff member
  deleteStaff: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await userAPI.deleteStaff(id);
      
      // Remove staff from the list
      const updatedStaff = get().staff.filter(member => member._id !== id);
      
      set({ staff: updatedStaff, loading: false });
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Staff deletion failed';
      set({ loading: false, error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  // Update profile
  updateProfile: async (profileData) => {
    set({ loading: true, error: null });
    try {
      const response = await userAPI.updateProfile(profileData);
      set({ loading: false });
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      set({ loading: false, error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Clear current staff
  clearCurrentStaff: () => {
    set({ currentStaff: null });
  },
}));