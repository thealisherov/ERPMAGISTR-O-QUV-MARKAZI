import api from './axios';
import { API_ENDPOINTS } from '../utils/constants';

export const authApi = {
  login: async (credentials) => {
    // credentials: { email, password }
    // Backend expects LoginRequest: { email, password }
    return api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
  },
  
  getProfile: () => {
    // Backend expects X-User-Id header which is added by axios interceptor
    return api.get(API_ENDPOINTS.AUTH.ME);
  },
  
  // Backend does not support logout endpoint
  // Logout is handled client-side
};
