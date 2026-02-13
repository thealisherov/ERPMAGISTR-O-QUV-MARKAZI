import api from './axios';

/**
 * Students API - Backend bilan 100% mos
 * 
 * Backend endpoints:
 * 
 * UserController (Admin/Teacher operations):
 * - GET /users/students - Get all students
 * - GET /users/{id} - Get user by ID
 * - POST /users/students - Create new student
 * - PUT /users/{id} - Update user profile
 * - DELETE /admin/users/{id} - Deactivate user
 * 
 * StudentController (Student's own data):
 * - GET /student/dashboard - Get student dashboard
 * - GET /student/groups - Get my groups
 * - GET /student/attendance - Get my attendance
 * - GET /student/attendance/summary - Get attendance summary
 * - GET /student/payments - Get my payments
 * - GET /student/coins - Get my coins
 * - GET /student/coins/summary - Get coin summary
 * - GET /student/coins/total - Get total coins
 */

export const studentsApi = {
  // ========== ADMIN/TEACHER OPERATIONS ON STUDENTS ==========

  // GET /users/students - Get all students
  getAll: () => {
    return api.get('/users/students');
  },

  // GET /users/{id} - Get student by ID
  getById: (id) => {
    return api.get(`/users/${id}`);
  },

  // POST /users/students - Create new student
  // CreateUserRequest: { email, password, fullName, phone, role }
  // Note: Backend forces role to STUDENT
  create: (studentData) => {
    return api.post('/users/students', studentData);
  },

  // PUT /users/{id} - Update student profile
  // UpdateUserRequest: { fullName, phone, email?, password?, role?, active? }
  update: (id, studentData) => {
    return api.put(`/users/${id}`, studentData);
  },

  // DELETE /admin/users/{id} - Deactivate student (Admin only)
  delete: (id) => {
    return api.delete(`/admin/users/${id}`);
  },

  // ========== STUDENT'S OWN DATA (Logged in Student) ==========

  // GET /student/dashboard - Get student dashboard
  getMyDashboard: () => {
    return api.get('/student/dashboard');
  },

  // GET /student/groups - Get my groups
  getMyGroups: () => {
    return api.get('/student/groups');
  },

  // GET /student/attendance - Get my attendance
  getMyAttendance: () => {
    return api.get('/student/attendance');
  },

  // GET /student/attendance/summary - Get attendance summary
  getMyAttendanceSummary: () => {
    return api.get('/student/attendance/summary');
  },

  // GET /student/payments - Get my payments
  getMyPayments: () => {
    return api.get('/student/payments');
  },

  // GET /student/coins - Get my coins
  getMyCoins: () => {
    return api.get('/student/coins');
  },

  // GET /student/coins/summary - Get coin summary
  getCoinSummary: () => {
    return api.get('/student/coins/summary');
  },

  // GET /student/coins/total - Get total coins
  getTotalCoins: () => {
    return api.get('/student/coins/total');
  },

  // ========== ADMIN: ORPHANED STUDENTS ==========

  // GET /admin/students/orphaned - Get orphaned students
  getOrphanedStudents: () => {
    return api.get('/admin/students/orphaned');
  },
};
