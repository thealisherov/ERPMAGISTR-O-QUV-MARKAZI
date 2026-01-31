export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout', // Not supported by backend
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh', // Not supported by backend
    ME: '/auth/profile',
  },
  USERS: '/admin/users',
  STUDENTS: '/student',
  TEACHERS: '/teacher',
  GROUPS: '/groups',
  PAYMENTS: '/payments',
  EXPENSES: '/expenses',
  REPORTS: '/reports',
  DASHBOARD: '/dashboard',
};

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  STUDENTS: '/students',
  TEACHERS: '/teachers',
  GROUPS: '/groups',
  PAYMENTS: '/payments',
  EXPENSES: '/expenses',
  REPORTS: '/reports',
};

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
};
