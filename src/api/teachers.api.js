import api from './axios';

export const teachersApi = {
  // --- Admin Operations on Teachers ---

  getAll: () => {
    return api.get('/admin/users/role/TEACHER');
  },

  getById: (id) => {
    return api.get(`/admin/users/${id}`);
  },

  create: (teacherData) => {
    return api.post('/auth/register', { ...teacherData, role: 'TEACHER' });
  },

  update: (id, teacherData) => {
    return api.put(`/admin/users/${id}`, teacherData);
  },

  delete: (id) => {
    return api.delete(`/admin/users/${id}`);
  },

  // --- Teacher's Own Data (Logged in Teacher) ---

  getMyDashboard: () => {
    return api.get('/teacher/dashboard');
  },

  getMyGroups: () => {
    return api.get('/teacher/groups');
  },

  getGroupById: (id) => {
    return api.get(`/teacher/groups/${id}`);
  },

  getGroupStudents: (id) => {
    return api.get(`/teacher/groups/${id}/students`);
  },

  getMyPayments: () => {
    return api.get('/teacher/payments');
  },

  getPaymentStats: () => {
    return api.get('/teacher/payments/stats');
  },

  // --- Teacher Actions ---

  markAttendance: (data) => {
    return api.post('/teacher/attendance', data);
  },

  updateAttendance: (id, data) => {
    return api.put(`/teacher/attendance/${id}`, data);
  },

  getGroupAttendance: (groupId) => {
    return api.get(`/teacher/attendance/group/${groupId}`);
  },

  recordPayment: (data) => {
    return api.post('/teacher/payments', data);
  },

  awardCoins: (data) => {
    return api.post('/teacher/coins', data);
  },

  getGroupCoins: (groupId) => {
    return api.get(`/teacher/coins/group/${groupId}`);
  },

  getGroupLeaderboard: (groupId) => {
    return api.get(`/teacher/coins/leaderboard/${groupId}`);
  }
};
