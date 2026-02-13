import api from './axios';

/**
 * Groups API - Backend bilan 100% mos
 * 
 * Backend endpoints:
 * 
 * GroupController:
 * - POST /groups - Create group (Teachers create for themselves, admins for any teacher)
 * - PUT /groups/{id} - Update group (Teachers can update only their groups)
 * - POST /groups/{groupId}/enroll/{studentId} - Enroll student in group
 * - DELETE /groups/{groupId}/students/{studentId} - Remove student from group
 * - GET /groups - Get all groups
 * - GET /groups/{id} - Get group by ID
 * - GET /groups/{id}/students - Get group students
 * 
 * AdminController:
 * - GET /admin/groups - Get all groups
 * - GET /admin/groups/{id} - Get group by ID
 * - GET /admin/groups/{id}/students - Get students in group
 */

export const groupsApi = {
  // GET /groups - Get all groups
  getAll: () => {
    return api.get('/groups');
  },

  // GET /admin/groups - Get all groups (Admin)
  getAdminGroups: () => {
    return api.get('/admin/groups');
  },

  // GET /groups/{id} - Get group by ID
  getById: (id) => {
    return api.get(`/groups/${id}`);
  },

  // POST /groups - Create group
  // CreateGroupRequest: { name, description, teacherId, schedule }
  create: (groupData) => {
    return api.post('/groups', groupData);
  },

  // PUT /groups/{id} - Update group
  // UpdateGroupRequest: { name, description, schedule, status }
  // status: ACTIVE | INACTIVE | COMPLETED
  update: (id, groupData) => {
    return api.put(`/groups/${id}`, groupData);
  },

  // Note: Backend does not have a delete group endpoint
  // Groups can only be deactivated by setting status to INACTIVE
  delete: (id) => {
    console.warn('Delete group endpoint is not available in backend. Use update with status: INACTIVE instead.', id);
    return Promise.reject(new Error('Feature not supported by backend. Use status update instead.'));
  },

  // POST /groups/{groupId}/enroll/{studentId} - Enroll student in group
  addStudent: (groupId, studentId) => {
    return api.post(`/groups/${groupId}/enroll/${studentId}`);
  },

  // DELETE /groups/{groupId}/students/{studentId} - Remove student from group
  removeStudent: (groupId, studentId) => {
    return api.delete(`/groups/${groupId}/students/${studentId}`);
  },

  // GET /groups/{id}/students - Get group students
  getGroupStudents: (groupId) => {
    return api.get(`/groups/${groupId}/students`);
  },
};
