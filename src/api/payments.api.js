import api from './axios';
import { usersApi } from './users.api';

/**
 * Payments API - Backend bilan 100% mos
 * 
 * Backend endpoints:
 * 
 * AdminController:
 * 
 * AdminController:
 * - POST /admin/payments - Create payment
 * - PUT /admin/payments/{id} - Update payment
 * - DELETE /admin/payments/{id} - Delete payment
 * - GET /admin/payments/teacher/{teacherId} - Get payments by teacher
 * - GET /admin/payments/student/{studentId} - Get payments by student
 * - GET /admin/payments/group/{groupId} - Get payments by group
 * 
 * TeacherController:
 * TeacherController:
 * - POST /teacher/payments - Record payment
 * - PUT /teacher/payments/{id} - Update payment
 * - DELETE /teacher/payments/{id} - Delete payment
 * - GET /teacher/payments - Get my payments
 * - GET /teacher/payments/stats - Get payment statistics
 * 
 * StudentController:
 * - GET /student/payments - Get my payments
 */

export const paymentsApi = {
  // ========== ADMIN OPERATIONS ==========
  
  // GET /admin/payments/pending - Backendda yo'q, shuning uchun workaround:
  // Barcha o'qituvchilarni olib, ularning to'lovlarini yig'ib qaytaramiz
  getAll: async () => {
    try {
      // 1. Get all teachers
      const teachersRes = await usersApi.getTeachers();
      const teachers = teachersRes.data;

      // 2. Get payments for each teacher
      const promises = teachers.map(teacher => 
        api.get(`/admin/payments/teacher/${teacher.id}`)
           .then(res => res.data)
           .catch(() => []) // Ignore errors for individual teachers
      );

      // 3. Wait for all and flatten
      const results = await Promise.all(promises);
      const allPayments = results.flat();

      // Sort by date (newest first)
      return { data: allPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)) };
    } catch (error) {
      console.error('Error fetching all payments:', error);
      return { data: [] };
    }
  },

  // POST /admin/payments - Create payment (Admin)
  // POST /teacher/payments - Record payment (Teacher)
  create: (paymentData, role) => {
    if (role === 'ADMIN') {
      return api.post('/admin/payments', paymentData);
    }
    return api.post('/teacher/payments', paymentData);
  },

  // PUT /admin/payments/{id} - Update payment (Admin)
  // PUT /teacher/payments/{id} - Update payment (Teacher)
  update: (id, paymentData, role) => {
    if (role === 'ADMIN') {
      return api.put(`/admin/payments/${id}`, paymentData);
    }
    return api.put(`/teacher/payments/${id}`, paymentData);
  },

  // DELETE /admin/payments/{id} - Delete payment (Admin)
  // DELETE /teacher/payments/{id} - Delete payment (Teacher)
  delete: (id, role) => {
    if (role === 'ADMIN') {
      return api.delete(`/admin/payments/${id}`);
    }
    return api.delete(`/teacher/payments/${id}`);
  },

  // GET /admin/payments/teacher/{teacherId} - Get payments by teacher
  getByTeacher: (teacherId) => {
    return api.get(`/admin/payments/teacher/${teacherId}`);
  },

  // GET /admin/payments/student/{studentId} - Get payments by student
  getByStudent: (studentId) => {
    return api.get(`/admin/payments/student/${studentId}`);
  },

  // GET /admin/payments/group/{groupId} - Get payments by group
  getByGroup: (groupId) => {
    return api.get(`/admin/payments/group/${groupId}`);
  },

  // ========== TEACHER OPERATIONS ==========



  // GET /teacher/payments - Get my payments (as teacher)
  getTeacherPayments: () => {
    return api.get('/teacher/payments');
  },

  // GET /teacher/payments/stats - Get payment statistics
  getTeacherStats: () => {
    return api.get('/teacher/payments/stats');
  },

  // ========== STUDENT OPERATIONS ==========

  // GET /student/payments - Get my payments (as student)
  getStudentPayments: () => {
    return api.get('/student/payments');
  },
};
