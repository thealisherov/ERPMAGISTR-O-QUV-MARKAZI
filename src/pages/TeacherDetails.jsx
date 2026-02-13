import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { teachersApi } from '../api/teachers.api';
import { groupsApi } from '../api/groups.api';
import { paymentsApi } from '../api/payments.api';
import { formatCurrency, formatDateTime } from '../api/helpers';
import { useAuth } from '../hooks/useAuth';
import {
  FiUser,
  FiPhone,
  FiMail,
  FiBook,
  FiArrowLeft,
  FiCreditCard,
  FiUsers
} from 'react-icons/fi';

/**
 * TeacherDetails - Backend bilan 100% mos
 * 
 * Backend endpoints:
 * - GET /users/{id} - Get teacher by ID
 * - GET /groups - Get all groups (filter by teacherId client-side)
 * - GET /admin/payments/teacher/{id} - Get payments by teacher (Admin only)
 */

const TeacherDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Fetch teacher data
  const { data: teacher, isLoading: teacherLoading } = useQuery({
    queryKey: ['teacher', id],
    queryFn: async () => {
      const res = await teachersApi.getById(id);
      return res.data;
    },
    enabled: !!id
  });

  // Fetch all groups and filter by teacher
  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['teacherGroups', id],
    queryFn: async () => {
      // Use Admin endpoint since this is an Admin page
      const res = await groupsApi.getAdminGroups();
      // Filter groups by teacherId
      return res.data.filter(g => g.teacherId === Number(id));
    },
    enabled: !!id
  });

  // Fetch payments by teacher (Admin only)
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['teacherPayments', id],
    queryFn: async () => {
      const res = await paymentsApi.getByTeacher(id);
      return res.data;
    },
    enabled: !!id && isAdmin
  });

  if (teacherLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!teacher) {
    return <div className="p-6 text-center text-gray-500">O'qituvchi topilmadi</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Link
        to="/teachers"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
      >
        <FiArrowLeft /> O'qituvchilarga qaytish
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
              {teacher.fullName?.charAt(0).toUpperCase() || 'T'}
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {teacher.fullName || 'Ism kiritilmagan'}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-600">
              <FiMail className="text-gray-400" />
              <span>{teacher.email || 'Email kiritilmagan'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <FiPhone className="text-gray-400" />
              <span>{teacher.phone || 'Telefon kiritilmagan'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <FiUser className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Rol</p>
                <p className="font-medium text-sm">{teacher.role}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Statistika</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Guruhlar soni:</span>
                <span className="font-bold text-gray-900">{groups.length}</span>
              </div>
              {isAdmin && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Yig'ilgan to'lovlar:</span>
                  <span className="font-bold text-gray-900">{payments.length} ta</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Groups Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiBook className="text-blue-600" />
              Guruhlar ({groups.length})
            </h3>

            {groupsLoading ? (
              <div className="text-center py-8 text-gray-500">Yuklanmoqda...</div>
            ) : groups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group) => (
                  <Link
                    key={group.id}
                    to={`/groups/${group.id}`}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <h4 className="font-semibold text-gray-900 mb-1">{group.name}</h4>
                    <p className="text-sm text-gray-500 mb-2">{group.description || 'Izoh mavjud emas'}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600 flex items-center gap-1">
                        <FiUsers className="text-gray-400" />
                        {group.studentCount || 0} ta o'quvchi
                      </span>
          
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Guruhlar topilmadi</p>
            )}
          </div>

          {/* Payments Section - Admin Only */}
          {isAdmin && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiCreditCard className="text-green-600" />
                Yig'ilgan To'lovlar ({payments.length})
              </h3>

              {paymentsLoading ? (
                <div className="text-center py-8 text-gray-500">Yuklanmoqda...</div>
              ) : payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-xs font-semibold text-gray-500">Talaba</th>
                        <th className="px-4 py-2 text-xs font-semibold text-gray-500">Guruh</th>
                        <th className="px-4 py-2 text-xs font-semibold text-gray-500">Summa</th>
                        <th className="px-4 py-2 text-xs font-semibold text-gray-500">Sana</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {payments.slice(0, 10).map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{payment.studentName}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{payment.groupName}</td>
                          <td className="px-4 py-3 text-sm font-bold text-green-600">{formatCurrency(payment.amount)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(payment.paymentDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {payments.length > 10 && (
                    <p className="text-center text-gray-500 text-sm mt-4">
                      va {payments.length - 10} ta boshqa to'lov...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">To'lovlar mavjud emas</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default TeacherDetails;