import api from './axios';

export const dashboardApi = {
  getAdminDashboard: () => {
    return api.get('/admin/dashboard');
  },

  getTeacherDashboard: () => {
    return api.get('/teacher/dashboard');
  },

  getStudentDashboard: () => {
    return api.get('/student/dashboard');
  },

  getDashboardByRole: (role) => {
    if (!role) return Promise.reject(new Error('Role is required'));

    switch (role) {
      case 'ADMIN':
        return dashboardApi.getAdminDashboard();
      case 'TEACHER':
        return dashboardApi.getTeacherDashboard();
      case 'STUDENT':
        return dashboardApi.getStudentDashboard();
      default:
        return Promise.reject(new Error(`Unknown role: ${role}`));
    }
  }
};
