import axios from 'axios';

const api = axios.create({
  baseURL: "https://magister-production-a4a6.up.railway.app/api",
  headers: {
    'Content-Type': 'application/json',
  },
});

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payloadStart = token.indexOf('.') + 1;
    const payloadEnd = token.indexOf('.', payloadStart);
    if (payloadStart === 0 || payloadEnd === -1) return true;
    const payload = token.substring(payloadStart, payloadEnd);
    const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (decodedPayload.exp) {
      return (decodedPayload.exp * 1000) < Date.now();
    }
    return false;
  } catch (e) {
    return true;
  }
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'undefined' && token !== 'null') {
      if (isTokenExpired(token)) {
        console.warn('Token expired before making request');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(new Error('Token expired'));
      }
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

    // DETAILED LOGGING FOR ALL REQUESTS
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 REQUEST:', config.method.toUpperCase(), config.url);
    console.log('   Headers:', {
      'X-User-Id': config.headers['X-User-Id'],
      'Authorization': config.headers.Authorization ? 'Bearer ***' : 'None'
    });
    if (config.data) {
      console.log('   Request Body:', config.data);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // DETAILED LOGGING FOR ALL RESPONSES
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 RESPONSE:', response.config.method.toUpperCase(), response.config.url);
    console.log('   Status:', response.status, response.statusText);
    console.log('   Response Data:', response.data);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERROR RESPONSE:', error.config?.method?.toUpperCase(), url);
    console.error('   Status:', status);
    console.error('   Error Data:', error.response?.data);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
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
