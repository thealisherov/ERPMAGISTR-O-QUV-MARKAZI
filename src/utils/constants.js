/**
 * API Endpoints - Backend bilan 100% mos
 * 
 * Backend Controllers:
 * - AuthController: /api/auth/*
 * - AdminController: /api/admin/*
 * - TeacherController: /api/teacher/*
 * - StudentController: /api/student/*
 * - GroupController: /api/groups/*
 * - UserController: /api/users/*
 */

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    GROUPS: '/admin/groups',
    PAYMENTS: {
      PENDING: '/admin/payments/pending',
      CONFIRM: (id) => `/admin/payments/${id}/confirm`,
      BY_TEACHER: (id) => `/admin/payments/teacher/${id}`,
      BY_STUDENT: (id) => `/admin/payments/student/${id}`,
      BY_GROUP: (id) => `/admin/payments/group/${id}`,
    },
    ATTENDANCE: {
      BY_GROUP: (id) => `/admin/attendance/group/${id}`,
      BY_STUDENT: (id) => `/admin/attendance/student/${id}`,
    },
    COINS: {
      BY_STUDENT: (id) => `/admin/coins/student/${id}`,
      BY_GROUP: (id) => `/admin/coins/group/${id}`,
      LEADERBOARD: (id) => `/admin/coins/leaderboard/${id}`,
    },
  },
  TEACHER: {
    DASHBOARD: '/teacher/dashboard',
    GROUPS: '/teacher/groups',
    STUDENTS: '/teacher/students',
    ATTENDANCE: '/teacher/attendance',
    PAYMENTS: '/teacher/payments',
    PAYMENT_STATS: '/teacher/payments/stats',
    COINS: '/teacher/coins',
  },
  STUDENT: {
    DASHBOARD: '/student/dashboard',
    GROUPS: '/student/groups',
    ATTENDANCE: '/student/attendance',
    ATTENDANCE_SUMMARY: '/student/attendance/summary',
    PAYMENTS: '/student/payments',
    COINS: '/student/coins',
    COIN_SUMMARY: '/student/coins/summary',
    COIN_TOTAL: '/student/coins/total',
  },
  GROUPS: '/groups',
  USERS: '/users',
};

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  STUDENTS: '/students',
  TEACHERS: '/teachers',
  GROUPS: '/groups',
  PAYMENTS: '/payments',
  USERS: '/users',
};

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
};

/**
 * Backend Enums
 */
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
};

export const GROUP_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  COMPLETED: 'COMPLETED',
};

export const PAYMENT_METHOD = {
  CASH: 'CASH',
  CARD: 'CARD',
  TRANSFER: 'TRANSFER',
};

export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  EXCUSED: 'EXCUSED',
};

export const ENROLLMENT_STATUS = {
  ACTIVE: 'ACTIVE',
  DROPPED: 'DROPPED',
  COMPLETED: 'COMPLETED',
};
