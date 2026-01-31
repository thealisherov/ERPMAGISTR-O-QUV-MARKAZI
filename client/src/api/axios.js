import axios from 'axios';

const api = axios.create({
  baseURL: "https://magister-production-a4a6.up.railway.app/api",
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add X-User-Id header if user is logged in
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined' && userStr !== 'null') {
      try {
        const user = JSON.parse(userStr);
        if (user.userId) {
          config.headers['X-User-Id'] = user.userId;
        }
      } catch (e) {
        console.error('Error parsing user from localStorage', e);
      }
    }

    // Debugging
    if (import.meta.env.DEV) {
      console.log(`Request: ${config.method.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    
    console.error(`[API Error] ${status} - ${url}`, error.response?.data);
    
    if (status === 401) {
      console.warn('401 Unauthorized - Token expired or invalid');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    else if (status === 403) {
      console.error('403 Forbidden - Permission denied');
    }
    
    return Promise.reject(error);
  }
);

export default api;
