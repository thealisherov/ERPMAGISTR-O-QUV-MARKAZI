import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';
import { usersApi } from '../api/users.api';
import { studentsApi } from '../api/students.api';
import { paymentsApi } from '../api/payments.api';
import { useAuth } from '../hooks/useAuth';
import { FiUsers, FiUserCheck, FiCreditCard, FiTrendingUp, FiPlus, FiBook, FiAward, FiClock, FiAlertTriangle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

/**
 * Dashboard Page - Backend bilan 100% mos
 * 
 * Backend DTOs:
 * 
 * AdminDashboardDTO: {
 *   totalUsers, totalGroups, activeGroups, totalStudents, totalTeachers,
 *   paymentStats: { totalAmount, confirmedAmount, pendingAmount, confirmedCount, pendingCount },
 *   recentUsers: UserDTO[],
 *   pendingPayments: PaymentDTO[],
 *   pendingPaymentsCount
 * }
 * 
 * TeacherDashboardDTO: {
 *   totalGroups, totalStudents, paymentStats
 * }
 * 
 * StudentDashboardDTO: {
 *   groups: GroupDTO[],
 *   attendanceSummary: { totalClasses, presentCount, absentCount, attendancePercentage },
 *   coinSummary: { totalCoins, earnedThisMonth }
 * }
 */

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;

  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ['dashboardStats', role],
    queryFn: async () => {
      if (!role) return null;
      let response = await dashboardApi.getDashboardByRole(role);
      let data = response.data;
      
      if (role === 'ADMIN') {
        try {
          const [studentsRes, teachersRes, orphanedRes, paymentsRes] = await Promise.all([
            usersApi.getStudents().catch(() => ({ data: [] })),
            usersApi.getTeachers().catch(() => ({ data: [] })),
            studentsApi.getOrphanedStudents().catch(() => ({ data: [] })),
            paymentsApi.getAll().catch(() => ({ data: [] }))
          ]);

          data.totalStudents = studentsRes.data.length;
          data.totalTeachers = teachersRes.data.length;
          data.orphanedStudentsCount = orphanedRes.data.length;
          
          const totalAmount = (paymentsRes.data || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
          data.paymentStats = {
            totalAmount: totalAmount
          };
        } catch (error) {
          console.error('Error fetching extra admin stats:', error);
        }
      }
      return data;
    },
    enabled: !!role,
    staleTime: 5 * 60 * 1000,
  });

  const formatCurrency = (amount) => {
    if (!amount) return '0 UZS';
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(amount));
  };

  const getStatCards = () => {
    if (!stats) return [];

    if (role === 'ADMIN') {
      return [
        { title: "Jami O'quvchilar", value: stats.totalStudents || 0, icon: FiUsers, bgColor: 'from-blue-500 to-blue-600' },
        { title: "O'qituvchilar", value: stats.totalTeachers || 0, icon: FiUserCheck, bgColor: 'from-purple-500 to-purple-600' },
        { title: 'Faol Guruhlar', value: stats.activeGroups || 0, icon: FiBook, bgColor: 'from-green-500 to-green-600' },
        { title: 'Jami Daromad', value: formatCurrency(stats.paymentStats?.totalAmount), icon: FiTrendingUp, bgColor: 'from-orange-500 to-orange-600' },
      ];
    } else if (role === 'TEACHER') {
      return [
        { title: "Mening O'quvchilarim", value: stats.totalStudents || 0, icon: FiUsers, bgColor: 'from-blue-500 to-blue-600' },
        { title: 'Guruhlarim', value: stats.totalGroups || 0, icon: FiBook, bgColor: 'from-purple-500 to-purple-600' },
        { title: 'Yig\'ilgan Pul', value: formatCurrency(stats.paymentStats?.totalAmount), icon: FiTrendingUp, bgColor: 'from-green-500 to-green-600' },
      ];
    } else { // STUDENT
      return [
        { title: 'Davomat (%)', value: `${stats.attendanceSummary?.attendancePercentage || 0}%`, icon: FiUserCheck, bgColor: 'from-blue-500 to-blue-600' },
        { title: 'Guruhlarim', value: stats.groups?.length || 0, icon: FiBook, bgColor: 'from-purple-500 to-purple-600' },
        { title: 'Coinlar', value: stats.coinSummary?.totalCoins || 0, icon: FiAward, bgColor: 'from-yellow-400 to-yellow-600' },
        { title: 'Darslar', value: stats.attendanceSummary?.totalClasses || 0, icon: FiCreditCard, bgColor: 'from-green-500 to-green-600' },
      ];
    }
  };

  const getQuickActions = () => {
    if (role === 'ADMIN') {
      return [
        { label: "Yangi O'quvchi", path: '/students', icon: FiPlus },
        { label: 'Yangi Guruh', path: '/groups', icon: FiPlus },
        { label: "To'lovlarni Ko'rish", path: '/payments', icon: FiCreditCard },
        { label: "O'qituvchilar", path: '/teachers', icon: FiUserCheck },
      ];
    } else if (role === 'TEACHER') {
      return [
        { label: 'Guruhlarim', path: '/groups', icon: FiBook },
        { label: "To'lov Kiritish", path: '/payments', icon: FiPlus },
        { label: "O'quvchilar", path: '/students', icon: FiUsers },
      ];
    } else {
      return [
        { label: 'Guruhlarim', path: '/groups', icon: FiBook },
        { label: "To'lovlarim", path: '/payments', icon: FiCreditCard },
      ];
    }
  };

  const statCards = getStatCards();
  const quickActions = getQuickActions();

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">
          Xush kelibsiz, <span className="font-semibold text-gray-700">{user?.fullName}</span>! ({role})
        </p>
      </div>

      {/* Admin: Orphaned Students Warning */}
      {role === 'ADMIN' && stats?.orphanedStudentsCount > 0 && (
        <div className="mb-6 bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-down">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-orange-500">
               <FiAlertTriangle className="h-6 w-6" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-orange-800">
                Diqqat! {stats.orphanedStudentsCount} ta guruhsiz o'quvchi mavjud
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                Bu o'quvchilar tizimga qo'shilgan, lekin hali hech qaysi guruhga biriktirilmagan.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/students/orphaned')}
            className="cursor-pointer px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-lg hover:bg-orange-700 shadow-md transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <FiUserCheck />
            Muammoni hal qilish
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 flex items-center justify-between gap-4 animate-pulse border border-gray-50"
            >
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                <div className="h-6 sm:h-8 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 bg-gray-200 rounded-2xl"></div>
            </div>
          ))
        ) : (
          statCards.map((card, index) => {
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-gray-50 shadow-sm hover:shadow-xl transition-all duration-300 p-4 xl:p-5 relative overflow-hidden group hover:-translate-y-1 cursor-default"
              >
                <div className={`absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-gradient-to-br ${card.bgColor} opacity-10 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out pointer-events-none`}></div>
                <div className="relative z-10 flex flex-col justify-center h-full">
                  <p className="text-xs sm:text-sm text-gray-500 font-medium truncate mb-1">{card.title}</p>
                  <h3 
                    className="text-base sm:text-lg md:text-xl font-extrabold text-gray-900 tracking-tight break-words"
                    title={card.value}
                  >
                    {card.value}
                  </h3>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 px-1">
          Tez Harakatlar
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className="cursor-pointer p-4 sm:p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 flex items-center gap-3 sm:gap-4 text-left group"
            >
              <div className="p-3 sm:p-4 bg-blue-50 rounded-xl group-hover:scale-110 group-hover:bg-blue-100 transition-all duration-300 shrink-0">
                <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <p className="text-sm sm:text-base font-bold text-gray-700 group-hover:text-blue-700 transition-colors line-clamp-2">{action.label}</p>
            </button>
          ))}
        </div>
      </div>



      {/* Student: My Groups Section */}
      {role === 'STUDENT' && stats?.groups?.length > 0 && (
        <div className="mt-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Mening Guruhlarim
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.groups.map((group) => (
                <div key={group.id} className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-bold text-gray-900">{group.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{group.teacherName}</p>
                  <p className="text-xs text-gray-500 mt-2">{group.schedule}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
