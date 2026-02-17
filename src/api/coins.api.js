import api from './axios';

export const coinsApi = {
  // Teacher endpoints
  award: (data) => api.post('/teacher/coins', data), // { studentId, groupId, amount, reason }
  getByStudent: (studentId) => api.get(`/teacher/coins/student/${studentId}`),
  getByGroup: (groupId) => api.get(`/teacher/coins/group/${groupId}`),
  getGroupLeaderboard: (groupId) => api.get(`/teacher/coins/leaderboard/${groupId}`),

  // Student endpoints
  getMyCoins: () => api.get('/student/coins'),
  getMySummary: () => api.get('/student/coins/summary'),
  getMyTotal: () => api.get('/student/coins/total'),
};
