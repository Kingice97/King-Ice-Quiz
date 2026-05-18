import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://king-ice-quiz.onrender.com';

// Create axios instance with better configuration
const api = axios.create({
  baseURL: API_URL + '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Track if we're already redirecting to prevent multiple redirects
let isRedirecting = false;

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Special handling for file uploads
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
      if (config.url?.includes('/upload')) {
        config.timeout = 30000;
      }
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    if (error.response) {
      const { status, data } = error.response;

      console.error(`API Error ${status}:`, {
        url: originalRequest?.url,
        message: data?.message || error.message,
      });

      if (status === 401) {
        // Don't redirect for upload endpoints - let the component handle it
        if (originalRequest?.url?.includes('/upload')) {
          error.userMessage = 'Please log in again to upload files.';
        }
        // Only redirect for auth-related endpoints
        else if (originalRequest?.url?.includes('/auth/me') ||
                 originalRequest?.url?.includes('/users/profile')) {

          // Clear auth data
          localStorage.removeItem('token');
          localStorage.removeItem('userData');

          // Prevent multiple redirects
          if (!isRedirecting && !window.location.pathname.includes('/login')) {
            isRedirecting = true;

            setTimeout(() => {
              window.location.href = '/login?session=expired';
            }, 100);
          }
        } else {
          error.userMessage = data?.message || 'Authentication required.';
        }
      }

      else if (status === 403) {
        error.userMessage = data?.message || 'You do not have permission to perform this action.';
      }

      else if (status === 404) {
        error.userMessage = data?.message || 'The requested resource was not found.';
      }

      else if (status === 429) {
        error.userMessage = 'Too many requests. Please wait a moment and try again.';
      }

      else if (status >= 500) {
        error.userMessage = data?.message || 'Server error. Please try again later.';
      }

      else {
        error.userMessage = data?.message || 'An error occurred. Please try again.';
      }

    } else if (error.request) {
      console.error('Network error:', {
        url: originalRequest?.url,
        message: error.message,
        code: error.code
      });

      if (error.code === 'ECONNABORTED') {
        error.userMessage = 'Request timeout. Please check your connection and try again.';
      } else {
        error.userMessage = 'Network error. Please check your internet connection.';
      }

    } else {
      console.error('Request setup error:', error.message);
      error.userMessage = 'An unexpected error occurred. Please try again.';
    }

    return Promise.reject(error);
  }
);

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('userData');
  return !!(token && userData);
};

// Helper function to get current user data
export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error.message);
    return null;
  }
};

// Helper function to set auth tokens
export const setAuthToken = (token) => {
  localStorage.setItem('token', token);
};

// Helper function to clear auth data
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  isRedirecting = false;
};

// Create a cancel token source for cancelling requests
export const createCancelToken = () => {
  return axios.CancelToken.source();
};

export default api;