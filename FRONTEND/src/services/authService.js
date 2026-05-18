import api from './api';

export const authService = {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData, {
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error.message);
      throw error;
    }
  },

  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials, {
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error('Login failed:', error.message);
      throw error;
    }
  },

  getMe: async () => {
    try {
      const response = await api.get('/auth/me', {
        timeout: 8000
      });

      if (response.data && response.data.user) {
        return response.data.user;
      } else if (response.data && response.data._id) {
        return response.data;
      } else {
        throw new Error('Invalid user data format received from server');
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - server is not responding');
      } else if (error.response?.status === 401) {
        throw new Error('Session expired - please log in again');
      } else if (error.response?.status === 404) {
        throw new Error('User not found');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error - please try again later');
      } else {
        throw error;
      }
    }
  },

  updateProfile: async (userData) => {
    try {
      const response = await api.put('/auth/profile', userData, {
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error('Profile update failed:', error.message);
      throw error;
    }
  },

  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/auth/password', passwordData, {
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error('Password change failed:', error.message);
      throw error;
    }
  },

  logout: async () => {
    try {
      const response = await api.post('/auth/logout', {}, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Logout failed:', error.message);
      return { success: true };
    }
  },

  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh-token', {}, {
        timeout: 8000
      });
      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error.message);
      throw error;
    }
  },

  verifyToken: async (token) => {
    try {
      const response = await api.post('/auth/verify-token', { token }, {
        timeout: 8000
      });
      return response.data;
    } catch (error) {
      console.error('Token verification failed:', error.message);
      throw error;
    }
  }
};