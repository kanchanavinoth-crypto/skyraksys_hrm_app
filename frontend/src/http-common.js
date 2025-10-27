import axios from "axios";

// Resolve API base URL from environment (fallback to same-origin /api)
const BASE_URL = process.env.REACT_APP_API_URL || "/api";

// Create axios instance
const http = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-type": "application/json"
  }
});

// Request interceptor to add auth token
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Ensure we reject with an Error instance (preserve AxiosError if already an Error)
    const err = error instanceof Error ? error : new Error(error?.message || 'Request error');
    return Promise.reject(err);
  }
);

// Response interceptor to handle authentication errors
http.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // If error is 401, clear auth data and redirect to login
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Ensure we reject with an Error instance (preserve AxiosError if already an Error)
    const err = error instanceof Error ? error : new Error(error?.message || 'Response error');
    return Promise.reject(err);
  }
);

export default http;
