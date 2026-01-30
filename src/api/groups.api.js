import api from './axios';

export const groupsApi = {
  getAll: () => {
    return api.get('/groups');
  },
  getById: (id) => {
    return api.get(`/groups/${id}`);
  },
  create: (groupData) => {
    return api.post('/groups', groupData);
  },
  update: (id, groupData) => {
    return api.put(`/groups/${id}`, groupData);
  },
  delete: (id) => {
    // Note: GroupController does not have a delete group endpoint.
    // AdminController does not have delete group endpoint either?
    // Checking AdminController...
    // AdminController has deleteUser but not deleteGroup?
    // It seems Group deletion is not supported in the provided backend code.
    // I will log a warning or leave it unimplemented.
    console.warn('Delete group endpoint is not available in backend', id);
    return Promise.reject(new Error('Feature not supported by backend'));
  },
  addStudent: (groupId, studentId) => {
    return api.post(`/groups/${groupId}/enroll/${studentId}`);
  },
  removeStudent: (groupId, studentId) => {
    return api.delete(`/groups/${groupId}/students/${studentId}`);
  },
  getGroupStudents: (groupId) => {
    return api.get(`/groups/${groupId}/students`);
  },
  // Additional helpful methods mapping to other controllers if needed,
  // but strictly speaking groupsApi should handle /groups.
  // getByTeacher is handled in teachers.api.js or by filtering getAll?
  // TeacherController has getMyGroups.
};
