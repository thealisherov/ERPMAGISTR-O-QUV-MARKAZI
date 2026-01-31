import api from './axios';

export const paymentsApi = {
  // --- Admin Operations ---
  getPending: () => {
    return api.get('/admin/payments/pending');
  },

  confirm: (id) => {
    return api.post(`/admin/payments/${id}/confirm`);
  },

  getByTeacher: (teacherId) => {
    return api.get(`/admin/payments/teacher/${teacherId}`);
  },

  getByStudent: (studentId) => {
    return api.get(`/admin/payments/student/${studentId}`);
  },

  getByGroup: (groupId) => {
    return api.get(`/admin/payments/group/${groupId}`);
  },

  // --- Teacher Operations ---
  create: (paymentData) => {
    return api.post('/teacher/payments', paymentData);
  },

  getTeacherPayments: () => {
    return api.get('/teacher/payments');
  },

  getTeacherStats: () => {
    return api.get('/teacher/payments/stats');
  },

  // --- Student Operations ---
  getStudentPayments: () => {
    return api.get('/student/payments');
  },
};
