import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { studentsApi } from '../../api/students.api';
import { teachersApi } from '../../api/teachers.api';
import { groupsApi } from '../../api/groups.api';
import { paymentsApi } from '../../api/payments.api';
import { formatCurrency, formatDateTime } from '../../api/helpers';
import { useAuth } from '../../hooks/useAuth';
import {
  FiUser,
  FiPhone,
  FiBook,
  FiDollarSign,
  FiMail,
  FiArrowLeft,
  FiAward,
  FiUserCheck,
  FiLoader
} from 'react-icons/fi';

/**
 * StudentDetails - Backend bilan 100% mos
 * 
 * Backend endpoints:
 * - GET /users/{id} - Get student by ID (faqat UserDTO qaytaradi: id, email, fullName, phone, role)
 * - GET /admin/payments/student/{id} - Get payments by student (Admin only)
 * - GET /admin/groups yoki GET /groups - Barcha guruhlarni olish
 * - GET /groups/{id}/students - Guruh studentlarini olish
 * 
 * MUHIM: GET /users/{id} guruh ma'lumotlarini QAYTARMAYDI!
 * Shuning uchun o'quvchining guruhlarini aniqlash uchun barcha guruhlarni olib,
 * har bir guruhning studentlarini tekshiramiz.
 */

const StudentDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

  // Fetch student data
  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ['student', id, user?.role],
    queryFn: async () => {
      if (user?.role === 'TEACHER') {
        try {
          const res = await teachersApi.getMyStudentById(id);
          return res.data;
        } catch (error) {
           throw error; 
        }
      }
      const res = await studentsApi.getById(id);
      return res.data;
    },
    enabled: !!id
  });

  // Fetch student's groups by checking all groups and their students
  // Backend UserDTO da groups ma'lumotlari yo'q, shuning uchun alohida fetch qilamiz
  const { data: studentGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['studentGroups', id, user?.role],
    queryFn: async () => {
      try {
        let allGroups = [];
        
        if (user?.role === 'TEACHER') {
          // Teacher faqat o'z guruhlarini ko'ra oladi
          const res = await teachersApi.getMyGroups();
          allGroups = res.data;
        } else if (user?.role === 'ADMIN') {
          const res = await groupsApi.getAdminGroups();
          allGroups = res.data;
        } else {
          const res = await groupsApi.getAll();
          allGroups = res.data;
        }

        // Har bir guruhning studentlarini tekshirish
        const studentId = Number(id);
        const matchedGroups = [];
        
        // Parallel ravishda barcha guruhlarning studentlarini olamiz
        const promises = allGroups.map(async (group) => {
          try {
            let studentsRes;
            if (user?.role === 'TEACHER') {
              studentsRes = await teachersApi.getGroupStudents(group.id);
            } else {
              studentsRes = await groupsApi.getGroupStudents(group.id);
            }
            const students = studentsRes.data;
            const found = students.some(s => s.id === studentId);
            if (found) {
              return group; // GroupDTO: id, name, teacherName, schedule, status, etc.
            }
          } catch (err) {
            console.warn(`Guruh #${group.id} studentlarini olishda xatolik:`, err);
          }
          return null;
        });
        
        const results = await Promise.all(promises);
        return results.filter(Boolean);
      } catch (err) {
        console.error('Guruhlarni yuklashda xatolik:', err);
        return [];
      }
    },
    enabled: !!id && !!user,
    staleTime: 60000, // 1 minut cache
  });

  // Fetch payments by student (Admin or Teacher)
  const canViewPayments = isAdmin || user?.role === 'TEACHER';

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['studentPayments', id, user?.role],
    queryFn: async () => {
      if (user?.role === 'TEACHER') {
        const res = await teachersApi.getStudentPayments(id);
        return res.data;
      }
      const res = await paymentsApi.getByStudent(id);
      return res.data;
    },
    enabled: !!id && canViewPayments
  });

  if (studentLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6 text-center text-gray-500">O'quvchi topilmadi</div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Link
        to="/students"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
      >
        <FiArrowLeft /> O'quvchilarga qaytish
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
              {student.fullName ? student.fullName.charAt(0).toUpperCase() : '?'}
            </div>
            <h2 className="text-xl font-bold text-gray-900 text-center">
              {student.fullName || 'Ism kiritilmagan'}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-600">
              <FiMail className="text-gray-400" />
              <span>{student.email || 'Email kiritilmagan'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <FiPhone className="text-gray-400" />
              <span>{student.phone || 'Telefon kiritilmagan'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <FiUser className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">ID</p>
                <p className="font-medium text-sm">{student.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <FiUser className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Rol</p>
                <p className="font-medium text-sm">{student.role}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Statistika</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Guruhlar soni:</span>
                <span className="font-bold text-gray-900">
                  {groupsLoading ? '...' : `${studentGroups.length} ta`}
                </span>
              </div>
              {canViewPayments && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">To'lovlar soni:</span>
                  <span className="font-bold text-gray-900">{payments.length} ta</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Groups Section - Backend dan to'g'ridan-to'g'ri olinadi */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiBook className="text-indigo-600" />
              Guruhlari
              {!groupsLoading && ` (${studentGroups.length})`}
            </h3>
            
            {groupsLoading ? (
              <div className="text-center py-8 text-gray-500 flex flex-col items-center gap-2">
                <FiLoader className="w-6 h-6 animate-spin text-indigo-500" />
                <span>Guruhlar yuklanmoqda...</span>
              </div>
            ) : studentGroups.length === 0 ? (
              <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2">
                <FiBook className="text-gray-400 w-8 h-8 opacity-50" />
                Guruhlarga biriktirilmagan
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentGroups.map((group) => (
                  <Link
                    key={group.id}
                    to={`/groups/${group.id}`}
                    className="flex flex-col p-4 rounded-xl border bg-white shadow-sm transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 hover:shadow-md hover:border-indigo-300 border-gray-100 cursor-pointer"
                  >
                    <div className="w-1.5 h-full bg-indigo-500 absolute left-0 top-0 transition-colors group-hover:bg-purple-600"></div>
                    <div className="font-bold text-gray-900 pl-2 text-lg group-hover:text-indigo-700 transition-colors">
                       {group.name || 'Nomsiz guruh'}
                    </div>
                    <div className="text-sm text-gray-500 mt-3 pl-2 space-y-2">
                      {group.teacherName && (
                         <div className="flex items-center gap-2">
                           <FiUser className="text-gray-400" /> {group.teacherName}
                         </div>
                      )}
                      {group.schedule && (
                         <div className="flex items-center gap-2 text-indigo-600 font-medium">
                           <FiBook className="text-indigo-400" /> {group.schedule}
                         </div>
                      )}
                      {group.status && (
                         <div className="flex items-center gap-2">
                           <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                             group.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                           }`}>
                             {group.status}
                           </span>
                         </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Payments Section - Admin and Teacher */}
          {canViewPayments && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiDollarSign className="text-green-600" />
                To'lovlar Tarixi ({payments.length})
              </h3>

              {paymentsLoading ? (
                <div className="text-center py-8 text-gray-500">Yuklanmoqda...</div>
              ) : payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-xs font-semibold text-gray-500">Sana</th>
                        <th className="px-4 py-2 text-xs font-semibold text-gray-500">Guruh</th>
                        <th className="px-4 py-2 text-xs font-semibold text-gray-500">Summa</th>
                        <th className="px-4 py-2 text-xs font-semibold text-gray-500">Usul</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatDateTime(payment.paymentDate)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {payment.groupName}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-green-600">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              payment.method === 'CASH' ? 'bg-green-100 text-green-700' :
                              payment.method === 'CARD' ? 'bg-blue-100 text-blue-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {payment.method === 'CASH' ? 'Naqd' : payment.method === 'CARD' ? 'Karta' : 'Transfer'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">To'lovlar tarixi mavjud emas</p>
              )}
            </div>
          )}

          {/* Info for users who cannot view payments */}
          {!canViewPayments && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiUserCheck className="text-blue-600" />
                O'quvchi Ma'lumotlari
              </h3>
              <p className="text-gray-500">
                Bu sahifada o'quvchi haqida asosiy ma'lumotlar ko'rsatilmoqda. 
                To'lovlar tarixini ko'rish uchun Administrator huquqi kerak.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;
