import { FiUser, FiMenu } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from 'react-router-dom';

/**
 * Navbar - Backend bilan 100% mos
 * 
 * Backend LoginResponse: { token, userId, email, fullName, role }
 * Context user: { userId, email, fullName, role, phone }
 */

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/students': "O'quvchilar",
  '/teachers': "O'qituvchilar",
  '/groups': 'Guruhlar',
  '/payments': "To'lovlar",
  '/users': 'Foydalanuvchilar',
};

const Navbar = ({ onToggleSidebar, onToggleCollapse, sidebarCollapsed }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    for (const [key, title] of Object.entries(pageTitles)) {
      if (path.startsWith(key)) return title;
    }
    return 'Dashboard';
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN': return { label: 'Admin', color: 'bg-blue-100 text-blue-700' };
      case 'TEACHER': return { label: "O'qituvchi", color: 'bg-green-100 text-green-700' };
      case 'STUDENT': return { label: "O'quvchi", color: 'bg-purple-100 text-purple-700' };
      default: return { label: role, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const roleBadge = getRoleBadge(user?.role);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onToggleSidebar}
            className="cursor-pointer p-2 -ml-2 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <FiMenu className="h-6 w-6 text-gray-600" />
          </button>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
            {getPageTitle()}
          </h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <span className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadge.color}`}>
            {roleBadge.label}
          </span>
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                {user?.fullName || 'Foydalanuvchi'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.email || ''}
              </p>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <FiUser className="h-5 w-5" />}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
