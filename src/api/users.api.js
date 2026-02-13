import api from './axios';

/**
 * Users API - Backend bilan 100% mos
 * 
 * Backend endpoints:
 * - GET /users - Get all users (Admin and Teacher)
 * - GET /users/{id} - Get user by ID
 * - POST /users/students - Create new student
 * - PUT /users/{id} - Update user profile
 * - GET /users/students - Get all students
 * - GET /users/teachers - Get all teachers
 * - DELETE /admin/users/{id} - Deactivate user (Admin only)
 */

export const usersApi = {
  // GET /users - Get all users (ADMIN and TEACHER can access)
  getAll: () => {
    return api.get('/users');
  },

  // GET /users/{id} - Get user by ID (ADMIN and TEACHER can access)
  getById: (id) => {
    return api.get(`/users/${id}`);
  },

  // GET /users/students - Get all students
  getStudents: () => {
    return api.get('/users/students');
  },

  // GET /users/teachers - Get all teachers
  getTeachers: () => {
    return api.get('/users/teachers');
  },

  // POST /users/students - Create student (ADMIN and TEACHER can create)
  // Backend forces role to STUDENT
  createStudent: (studentData) => {
    return api.post('/users/students', studentData);
  },

  // PUT /users/{id} - Update user profile
  // UpdateUserRequest: { fullName, phone, email?, password?, role?, active? }
  update: (id, userData) => {
    return api.put(`/users/${id}`, userData);
  },

  // DELETE /admin/users/{id} - Deactivate user (ADMIN only)
  delete: (id) => {
    return api.delete(`/admin/users/${id}`);
  },

  // Create user - routes to appropriate endpoint based on role
  create: (userData) => {
    // If creating a student, use /users/students endpoint
    if (userData.role === 'STUDENT') {
      return api.post('/users/students', userData);
    }
    // For ADMIN/TEACHER creation, use auth register
    // CreateUserRequest: { email, password, fullName, phone, role }
    return api.post('/auth/register', userData);
  },
};
