import api from './axios';

/**
 * Auth API - Backend bilan 100% mos
 * 
 * Backend AuthController:
 * - POST /auth/login - Login and get JWT token
 *   LoginRequest: { email, password }
 *   LoginResponse: { token, userId, email, fullName, role }
 * 
 * - GET /auth/profile - Get current user's profile (requires X-User-Id header)
 *   Returns UserDTO: { id, email, fullName, phone, role, active }
 * 
 * - POST /auth/register - Register new user (Admin operation)
 *   CreateUserRequest: { email, password, fullName, phone, role }
 */

export const authApi = {
  // POST /auth/login
  login: async (credentials) => {
    // credentials: { email, password }
    return api.post('/auth/login', credentials);
  },
  
  // GET /auth/profile
  getProfile: () => {
    // Backend expects X-User-Id header which is added by axios interceptor
    return api.get('/auth/profile');
  },
  
  // POST /auth/register - Create new user (used by admin for teachers)
  register: (userData) => {
    // userData: { email, password, fullName, phone, role }
    return api.post('/auth/register', userData);
  },
  
  // Backend does not support logout endpoint
  // Logout is handled client-side by clearing localStorage
};
