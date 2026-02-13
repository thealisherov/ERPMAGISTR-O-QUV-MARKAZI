import api from './axios';

/**
 * Teachers API - Backend bilan 100% mos
 * 
 * Backend TeacherController endpoints:
 * 
 * Dashboard:
 * - GET /teacher/dashboard
 * 
 * Groups:
 * - GET /teacher/groups - Get my groups
 * - GET /teacher/groups/{id} - Get group details
 * - GET /teacher/groups/{id}/students - Get students in my group
 * 
 * Students:
 * - GET /teacher/students - Get all my students
 * - GET /teacher/students/{id} - Get student details
 * - PUT /teacher/students/{id} - Update student (same as admin)
 * 
 * Attendance:
 * - POST /teacher/attendance - Mark attendance
 * - PUT /teacher/attendance/{id} - Update attendance
 * - GET /teacher/attendance/group/{groupId} - Get group attendance
 * - GET /teacher/attendance/student/{studentId} - Get student attendance
 * 
 * Payments:
 * - POST /teacher/payments - Record payment (auto-confirmed)
 * - GET /teacher/payments - Get my payments
 * - GET /teacher/payments/student/{studentId} - Get student payments
 * - GET /teacher/payments/group/{groupId} - Get group payments
 * - GET /teacher/payments/stats - Get payment stats
 * 
 * Coins:
 * - POST /teacher/coins - Award coins
 * - GET /teacher/coins/student/{studentId} - Get student coins
 * - GET /teacher/coins/group/{groupId} - Get group coins
 * - GET /teacher/coins/leaderboard/{groupId} - Get leaderboard
 */

export const teachersApi = {
  // ========== ADMIN OPERATIONS ON TEACHERS ==========

  // GET /users/teachers - Get all teachers
  getAll: () => {
    return api.get('/users/teachers');
  },

  // GET /users/{id} - Get teacher by ID
  getById: (id) => {
    return api.get(`/users/${id}`);
  },

  // POST /auth/register - Create new teacher
  create: (teacherData) => {
    return api.post('/auth/register', { ...teacherData, role: 'TEACHER' });
  },

  // PUT /users/{id} - Update teacher profile
  update: (id, teacherData) => {
    return api.put(`/users/${id}`, teacherData);
  },

  // DELETE /admin/users/{id} - Deactivate teacher (Admin only)
  delete: (id) => {
    return api.delete(`/admin/users/${id}`);
  },

  // ========== TEACHER'S OWN DATA ==========

  // GET /teacher/dashboard
  getMyDashboard: () => {
    return api.get('/teacher/dashboard');
  },

  // ========== GROUPS ==========

  // GET /teacher/groups
  getMyGroups: () => {
    return api.get('/teacher/groups');
  },

  // GET /teacher/groups/{id}
  getGroupById: (id) => {
    return api.get(`/teacher/groups/${id}`);
  },

  // GET /teacher/groups/{id}/students
  getGroupStudents: (id) => {
    return api.get(`/teacher/groups/${id}/students`);
  },

  // ========== STUDENTS ==========

  // GET /teacher/students
  getMyStudents: () => {
    return api.get('/teacher/students');
  },

  // GET /teacher/students/{id}
  getMyStudentById: (id) => {
    return api.get(`/teacher/students/${id}`);
  },

  // PUT /teacher/students/{id} - O'quvchini tahrirlash (yangi)
  updateStudent: (id, data) => {
    return api.put(`/teacher/students/${id}`, data);
  },

  // ========== ATTENDANCE ==========

  // POST /teacher/attendance
  markAttendance: (data) => {
    return api.post('/teacher/attendance', data);
  },

  // PUT /teacher/attendance/{id}
  updateAttendance: (id, data) => {
    return api.put(`/teacher/attendance/${id}`, data);
  },

  // GET /teacher/attendance/group/{groupId}
  getGroupAttendance: (groupId) => {
    return api.get(`/teacher/attendance/group/${groupId}`);
  },

  // GET /teacher/attendance/student/{studentId} (yangi)
  getStudentAttendance: (studentId) => {
    return api.get(`/teacher/attendance/student/${studentId}`);
  },

  // ========== PAYMENTS ==========

  // POST /teacher/payments (auto-confirmed)
  recordPayment: (data) => {
    return api.post('/teacher/payments', data);
  },

  // GET /teacher/payments
  getMyPayments: () => {
    return api.get('/teacher/payments');
  },

  // GET /teacher/payments/student/{studentId} (yangi)
  getStudentPayments: (studentId) => {
    return api.get(`/teacher/payments/student/${studentId}`);
  },

  // GET /teacher/payments/group/{groupId} (yangi)
  getGroupPayments: (groupId) => {
    return api.get(`/teacher/payments/group/${groupId}`);
  },

  // GET /teacher/payments/stats
  getPaymentStats: () => {
    return api.get('/teacher/payments/stats');
  },

  // ========== COINS ==========

  // POST /teacher/coins
  awardCoins: (data) => {
    return api.post('/teacher/coins', data);
  },

  // GET /teacher/coins/student/{studentId} (yangi)
  getStudentCoins: (studentId) => {
    return api.get(`/teacher/coins/student/${studentId}`);
  },

  // GET /teacher/coins/group/{groupId}
  getGroupCoins: (groupId) => {
    return api.get(`/teacher/coins/group/${groupId}`);
  },

  // GET /teacher/coins/leaderboard/{groupId}
  getGroupLeaderboard: (groupId) => {
    return api.get(`/teacher/coins/leaderboard/${groupId}`);
  },
};
