import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';
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
      const response = await dashboardApi.getDashboardByRole(role);
      return response.data;
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
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Xush kelibsiz, {user?.fullName}! ({role})
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
              className="bg-white rounded-xl shadow-md p-6 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          ))
        ) : (
          statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{card.title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">
                      {card.value}
                    </h3>
                  </div>
                  <div className={`w-14 h-14 bg-gradient-to-br ${card.bgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Tez Harakatlar
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                className="cursor-pointer p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2 text-center"
              >
                <action.icon className="h-6 w-6 text-blue-600" />
                <p className="text-sm font-medium text-gray-700">{action.label}</p>
              </button>
            ))}
          </div>
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
