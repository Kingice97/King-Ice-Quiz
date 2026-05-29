import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('userData');

      if (!token && !userData) {
        setUser(null);
        setLoading(false);
        return;
      }

      if (userData && !token) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setLoading(false);
          return;
        } catch (parseError) {
          console.error('Error parsing cached user data:', parseError.message);
          clearAuthData();
          setLoading(false);
          return;
        }
      }

      if (token) {
        try {
          if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
          }

          const freshUserData = await authService.getMe();

          const userWithOnlineStatus = {
            ...freshUserData,
            isOnline: true
          };

          setUser(userWithOnlineStatus);
          localStorage.setItem('userData', JSON.stringify(userWithOnlineStatus));

        } catch (authError) {
          if (userData) {
            try {
              const parsedUser = JSON.parse(userData);
              setUser(parsedUser);
            } catch (parseError) {
              console.error('Error parsing cached user data:', parseError.message);
              clearAuthData();
            }
          } else {
            clearAuthData();
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setUser(null);
  };

  const login = async (credentials) => {
    try {
      setError('');
      setLoading(true);

      if (typeof authService.login !== 'function') {
        throw new Error('authService.login is not a function!');
      }

      const response = await authService.login(credentials);

      const { token, user } = response;

      if (!token) {
        throw new Error('No token received from server');
      }

      if (!user) {
        throw new Error('No user data received from server');
      }

      const userWithOnlineStatus = {
        ...user,
        isOnline: true
      };

      localStorage.setItem('token', token);
      localStorage.setItem('userData', JSON.stringify(userWithOnlineStatus));
      setUser(userWithOnlineStatus);

      return response;
    } catch (error) {
      console.error('Login error:', error.message);

      let message = 'Login failed';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      }

      setError(message);
      clearAuthData();
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError('');
      setLoading(true);

      if (typeof authService.register !== 'function') {
        throw new Error('authService.register is not a function!');
      }

      const response = await authService.register(userData);

      const { token, user } = response;

      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      const userWithOnlineStatus = {
        ...user,
        isOnline: true
      };

      localStorage.setItem('token', token);
      localStorage.setItem('userData', JSON.stringify(userWithOnlineStatus));
      setUser(userWithOnlineStatus);

      return response;
    } catch (error) {
      console.error('Registration error:', error.message);

      const message = error.response?.data?.message || error.message || 'Registration failed';
      setError(message);
      clearAuthData();
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error.message);
    } finally {
      clearAuthData();
      setError('');
    }
  };

  const updateUser = async (userData) => {
    try {
      setError('');

      const response = await userService.updateProfile(userData);

      const updatedUser = { ...user, ...response.user };
      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));

      return response;
    } catch (error) {
      console.error('Profile update error:', error.message);
      const message = error.response?.data?.message || 'Profile update failed';
      setError(message);
      throw error;
    }
  };

  const updatePassword = async (passwordData) => {
    try {
      setError('');

      const response = await userService.changePassword(passwordData);
      return response;
    } catch (error) {
      console.error('Password update error:', error.message);
      const message = error.response?.data?.message || 'Password change failed';
      setError(message);
      throw error;
    }
  };

  const updateProfilePicture = async (imageFile) => {
    try {
      setError('');

      const formData = new FormData();
      formData.append('profilePicture', imageFile);

      const response = await userService.uploadProfilePicture(formData);

      const updatedUser = {
        ...user,
        profile: {
          ...user.profile,
          picture: response.profilePicture
        }
      };

      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));

      return response;
    } catch (error) {
      console.error('Profile picture update error:', error.message);
      const message = error.response?.data?.message || 'Profile picture update failed';
      setError(message);
      throw error;
    }
  };

  const updateChatPreferences = async (preferences) => {
    try {
      setError('');

      const response = await userService.updateChatPreferences(preferences);

      const updatedUser = {
        ...user,
        preferences: { ...user.preferences, ...response.preferences }
      };
      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));

      return response;
    } catch (error) {
      console.error('Chat preferences update error:', error.message);
      const message = error.response?.data?.message || 'Chat preferences update failed';
      setError(message);
      throw error;
    }
  };

  const clearError = () => {
    setError('');
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.getMe();

      const userWithOnlineStatus = {
        ...userData,
        isOnline: user?.isOnline || true
      };

      setUser(userWithOnlineStatus);
      localStorage.setItem('userData', JSON.stringify(userWithOnlineStatus));
    } catch (error) {
      console.error('Refresh user failed:', error.message);
    }
  };

  const getSafeUser = () => {
    if (user) return user;

    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        return JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error getting fallback user data:', error.message);
    }

    return null;
  };

 const value = {
    user: getSafeUser(),
    login,
    register,
    logout,
    updateUser,
    updatePassword,
    updateProfilePicture,
    updateChatPreferences,
    refreshUser,
    loading,
    error,
    clearError,
    isAuthenticated: !!getSafeUser(),
    isAdmin: getSafeUser()?.role === 'admin' || getSafeUser()?.role === 'superadmin',
    isSuperAdmin: getSafeUser()?.isSuperAdmin || false,  // ADD THIS
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};