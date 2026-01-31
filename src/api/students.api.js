import api from './axios';

export const studentsApi = {
  // --- Admin/Teacher Operations on Students ---
  // Note: These endpoints require ADMIN or TEACHER role (check SecurityConfig)

  getAll: () => {
    return api.get('/admin/users/role/STUDENT');
  },
  
  getById: (id) => {
    return api.get(`/admin/users/${id}`);
  },
  
  create: (studentData) => {
    // Ensure role is set to STUDENT
    return api.post('/auth/register', { ...studentData, role: 'STUDENT' });
  },
  
  update: (id, studentData) => {
    return api.put(`/admin/users/${id}`, studentData);
  },
  
  delete: (id) => {
    return api.delete(`/admin/users/${id}`);
  },
  
  // --- Student's Own Data (Logged in Student) ---
  getMyDashboard: () => {
    return api.get('/student/dashboard');
  },
  
  getMyGroups: () => {
    return api.get('/student/groups');
  },
  
  getMyAttendance: () => {
    return api.get('/student/attendance');
  },
  
  getMyAttendanceSummary: () => {
    return api.get('/student/attendance/summary');
  },
  
  getMyPayments: () => {
    return api.get('/student/payments');
  },
  
  getMyCoins: () => {
    return api.get('/student/coins');
  },

  getCoinSummary: () => {
    return api.get('/student/coins/summary');
  }
};
