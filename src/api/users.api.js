import api from './axios';

export const usersApi = {
  getAll: () => {
    return api.get('/admin/users');
  },

  getById: (id) => {
    return api.get(`/admin/users/${id}`);
  },

  getByRole: (role) => {
    return api.get(`/admin/users/role/${role}`);
  },

  create: (userData) => {
    return api.post('/admin/users', userData);
  },

  update: (id, userData) => {
    return api.put(`/admin/users/${id}`, userData);
  },

  delete: (id) => {
    return api.delete(`/admin/users/${id}`);
  },
};
