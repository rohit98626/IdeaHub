/**
 * API Service Layer
 * ================
 * 
 * This module provides a centralized API client for communicating with the backend.
 * It handles authentication, error management, and provides organized API methods
 * for all backend endpoints.
 * 
 * Key Features:
 * - Automatic JWT token attachment to requests
 * - Centralized error handling (401 redirects to login)
 * - Organized API methods by feature (auth, ideas, clusters, etc.)
 * - Environment-based configuration
 * - Request/response interceptors for common functionality
 */

import axios from 'axios';

// =============================================================================
// AXIOS INSTANCE CONFIGURATION
// =============================================================================

/**
 * Create axios instance with base configuration
 * Sets up the HTTP client with default settings and base URL
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',  // Backend API URL
  headers: {
    'Content-Type': 'application/json',  // Default content type for all requests
  },
});

// =============================================================================
// REQUEST INTERCEPTOR - AUTHENTICATION
// =============================================================================

/**
 * Add request interceptor to automatically include JWT token
 * This ensures all API calls are authenticated without manual token handling
 */
api.interceptors.request.use(
  (config) => {
    // Get stored JWT token from localStorage
    const token = localStorage.getItem(process.env.REACT_APP_AUTH_TOKEN_KEY || 'idea_hub_auth_token');
    if (token) {
      // Add Bearer token to Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =============================================================================
// RESPONSE INTERCEPTOR - ERROR HANDLING
// =============================================================================

/**
 * Add response interceptor to handle authentication errors
 * Automatically redirects to login when token is expired or invalid
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect to login
      localStorage.removeItem(process.env.REACT_APP_AUTH_TOKEN_KEY || 'idea_hub_auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// =============================================================================
// AUTHENTICATION API
// =============================================================================

/**
 * Authentication API methods
 * Handles user registration, login, and profile management
 */
export const authAPI = {
  /**
   * Register a new user account
   * @param {Object} userData - User registration data (email, password, username, etc.)
   * @returns {Object} Registration response with user data and token
   */
  register: async (userData) => {
    const response = await api.post('/api/v1/users/register', userData);
    return response.data;
  },

  /**
   * Login user with email and password
   * @param {string} email - User email address
   * @param {string} password - User password
   * @returns {Object} Login response with user data and JWT token
   */
  login: async (email, password) => {
    const response = await api.post('/api/v1/users/login', null, {
      params: { email, password }
    });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/v1/users/me');
    return response.data;
  },

  updateUser: async (userData) => {
    const response = await api.put('/api/v1/users/me', userData);
    return response.data;
  },

  getUserStats: async () => {
    const response = await api.get('/api/v1/users/stats');
    return response.data;
  }
};

// Ideas API calls
export const ideasAPI = {
  getIdeas: async (skip = 0, limit = 100) => {
    const response = await api.get('/api/v1/ideas/', {
      params: { skip, limit }
    });
    return response.data;
  },

  createIdea: async (ideaData) => {
    const response = await api.post('/api/v1/ideas/', ideaData);
    return response.data;
  },

  getIdea: async (ideaId) => {
    const response = await api.get(`/api/v1/ideas/${ideaId}`);
    return response.data;
  },

  updateIdea: async (ideaId, ideaData) => {
    const response = await api.put(`/api/v1/ideas/${ideaId}`, ideaData);
    return response.data;
  },

  deleteIdea: async (ideaId) => {
    const response = await api.delete(`/api/v1/ideas/${ideaId}`);
    return response.data;
  },

  uploadIdeaFile: async (file, title, tags = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('tags', tags);

    const response = await api.post('/api/v1/ideas/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Voice-related API calls
  transcribeVoice: async (audioFile, language = 'en-US') => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('language', language);
    
    const response = await api.post('/api/v1/ideas/voice/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  createVoiceIdea: async (audioFile, language = 'en-US', title = '', tags = '') => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('language', language);
    formData.append('title', title);
    formData.append('tags', tags);
    
    const response = await api.post('/api/v1/ideas/voice/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getSupportedLanguages: async () => {
    const response = await api.get('/api/v1/ideas/voice/languages');
    return response.data;
  },

  searchIdeas: async (query) => {
    const response = await api.get(`/api/v1/ideas/search/${encodeURIComponent(query)}`);
    return response.data;
  }
};

// Clusters API calls
export const clustersAPI = {
  getClusters: async () => {
    const response = await api.get('/api/v1/clusters/');
    return response.data;
  },

  generateClusters: async () => {
    const response = await api.post('/api/v1/clusters/generate');
    return response.data;
  },

  getCluster: async (clusterId) => {
    const response = await api.get(`/api/v1/clusters/${clusterId}`);
    return response.data;
  },

  updateCluster: async (clusterId, clusterData) => {
    const response = await api.put(`/api/v1/clusters/${clusterId}`, clusterData);
    return response.data;
  },

  deleteCluster: async (clusterId) => {
    const response = await api.delete(`/api/v1/clusters/${clusterId}`);
    return response.data;
  },

  getSimilarClusters: async (clusterId) => {
    const response = await api.get(`/api/v1/clusters/${clusterId}/similar`);
    return response.data;
  }
};

// Innovation API calls
export const innovationAPI = {
  combineIdeas: async (ideaIds, combinationType = 'creative') => {
    const response = await api.post('/api/v1/innovation/combine', {
      idea_ids: ideaIds,
      combination_type: combinationType
    });
    return response.data;
  },

  expandIdea: async (ideaId, expansionType = 'comprehensive') => {
    const response = await api.post('/api/v1/innovation/expand', {
      idea_id: ideaId,
      expansion_type: expansionType
    });
    return response.data;
  },

  getCombinations: async (skip = 0, limit = 100) => {
    const response = await api.get('/api/v1/innovation/combinations', {
      params: { skip, limit }
    });
    return response.data;
  },

  getExpansions: async (skip = 0, limit = 100) => {
    const response = await api.get('/api/v1/innovation/expansions', {
      params: { skip, limit }
    });
    return response.data;
  },

  getExpansionSuggestions: async (ideaId) => {
    const response = await api.get(`/api/v1/innovation/suggestions/${ideaId}`);
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/api/v1/innovation/analytics');
    return response.data;
  }
};

// Innovation Results API calls (for saved innovation history)
export const innovationResultsAPI = {
  getResults: async (type = null) => {
    const params = type ? { type } : {};
    const response = await api.get('/api/v1/innovation-results/', { params });
    return response.data;
  },

  getResult: async (resultId) => {
    const response = await api.get(`/api/v1/innovation-results/${resultId}`);
    return response.data;
  },

  createResult: async (resultData) => {
    const response = await api.post('/api/v1/innovation-results/', resultData);
    return response.data;
  },

  updateResult: async (resultId, updateData) => {
    const response = await api.put(`/api/v1/innovation-results/${resultId}`, updateData);
    return response.data;
  },

  deleteResult: async (resultId) => {
    const response = await api.delete(`/api/v1/innovation-results/${resultId}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/api/v1/innovation-results/stats/summary');
    return response.data;
  },

  downloadPDF: async (resultId) => {
    const response = await api.get(`/api/v1/innovation-results/${resultId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

// Settings API calls
export const settingsAPI = {
  getSettings: async () => {
    const response = await api.get('/api/v1/settings/');
    return response.data;
  },
  
  updateSettings: async (settingsData) => {
    const response = await api.put('/api/v1/settings/', settingsData);
    return response.data;
  },
  
  exportData: async (exportOptions) => {
    const response = await api.post('/api/v1/settings/export', exportOptions, {
      responseType: 'blob'
    });
    return response.data;
  },
  
  deleteAccount: async () => {
    const response = await api.delete('/api/v1/settings/account');
    return response.data;
  },
  
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/api/v1/settings/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/api/v1/settings/stats');
    return response.data;
  }
};

export default api;
