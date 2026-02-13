import api from './axios';

/**
 * Dashboard API - Backend bilan 100% mos
 * 
 * Backend endpoints:
 * 
 * AdminController:
 * - GET /admin/dashboard - Get admin dashboard
 *   Returns AdminDashboardDTO: {
 *     totalUsers, totalGroups, activeGroups, totalStudents, totalTeachers,
 *     paymentStats, recentUsers, pendingPayments, pendingPaymentsCount
 *   }
 * 
 * TeacherController:
 * - GET /teacher/dashboard - Get teacher dashboard
 *   Returns TeacherDashboardDTO: {
 *     totalGroups, totalStudents, paymentStats
 *   }
 * 
 * StudentController:
 * - GET /student/dashboard - Get student dashboard
 *   Returns StudentDashboardDTO: {
 *     groups, attendanceSummary, coinSummary
 *   }
 */

export const dashboardApi = {
  // GET /admin/dashboard - Get admin dashboard
  getAdminDashboard: () => {
    return api.get('/admin/dashboard');
  },

  // GET /teacher/dashboard - Get teacher dashboard
  getTeacherDashboard: () => {
    return api.get('/teacher/dashboard');
  },

  // GET /student/dashboard - Get student dashboard
  getStudentDashboard: () => {
    return api.get('/student/dashboard');
  },

  // Helper: Get dashboard by role
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
  },
};
