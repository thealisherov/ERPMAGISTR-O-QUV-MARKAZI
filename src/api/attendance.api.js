import api from './axios';

export const attendanceApi = {
  // --- Teacher Operations ---
  mark: (data) => {
    return api.post('/teacher/attendance', data);
  },

  update: (id, data) => {
    return api.put(`/teacher/attendance/${id}`, data);
  },

  getByGroupForTeacher: (groupId) => {
    return api.get(`/teacher/attendance/group/${groupId}`);
  },

  // --- Student Operations ---
  getMyAttendance: () => {
    return api.get('/student/attendance');
  },

  getMySummary: () => {
    return api.get('/student/attendance/summary');
  },

  // --- Admin Operations ---
  getByGroup: (groupId) => {
    return api.get(`/admin/attendance/group/${groupId}`);
  },

  getByStudent: (studentId) => {
    return api.get(`/admin/attendance/student/${studentId}`);
  },
};
