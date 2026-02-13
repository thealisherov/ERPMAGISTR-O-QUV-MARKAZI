import api from './axios';

/**
 * Attendance API - Backend bilan 100% mos
 * 
 * Backend endpoints:
 * 
 * TeacherController:
 * - POST /teacher/attendance - Mark attendance
 *   MarkAttendanceRequest: { studentId, groupId, lessonDate, status, notes }
 *   status: PRESENT | ABSENT | LATE | EXCUSED
 * - PUT /teacher/attendance/{id} - Update attendance
 *   UpdateAttendanceRequest: { status, notes }
 * - GET /teacher/attendance/group/{groupId} - Get attendance for my group
 * 
 * StudentController:
 * - GET /student/attendance - Get my attendance
 * - GET /student/attendance/summary - Get attendance summary
 *   Returns AttendanceSummary: { totalClasses, presentCount, absentCount, attendancePercentage }
 * 
 * AdminController:
 * - GET /admin/attendance/group/{groupId} - Get attendance by group
 * - GET /admin/attendance/student/{studentId} - Get attendance by student
 */

export const attendanceApi = {
  // ========== TEACHER OPERATIONS ==========

  // POST /teacher/attendance - Mark attendance
  // MarkAttendanceRequest: { studentId, groupId, lessonDate, status, notes }
  mark: (data) => {
    return api.post('/teacher/attendance', data);
  },

  // PUT /teacher/attendance/{id} - Update attendance
  // UpdateAttendanceRequest: { status, notes }
  update: (id, data) => {
    return api.put(`/teacher/attendance/${id}`, data);
  },

  // GET /teacher/attendance/group/{groupId} - Get attendance for teacher's group
  getByGroupForTeacher: (groupId) => {
    return api.get(`/teacher/attendance/group/${groupId}`);
  },

  // ========== STUDENT OPERATIONS ==========

  // GET /student/attendance - Get my attendance
  getMyAttendance: () => {
    return api.get('/student/attendance');
  },

  // GET /student/attendance/summary - Get attendance summary
  getMySummary: () => {
    return api.get('/student/attendance/summary');
  },

  // ========== ADMIN OPERATIONS ==========

  // GET /admin/attendance/group/{groupId} - Get attendance by group
  getByGroup: (groupId) => {
    return api.get(`/admin/attendance/group/${groupId}`);
  },

  // GET /admin/attendance/student/{studentId} - Get attendance by student
  getByStudent: (studentId) => {
    return api.get(`/admin/attendance/student/${studentId}`);
  },
};
