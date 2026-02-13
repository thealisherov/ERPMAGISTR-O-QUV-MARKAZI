import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiUsers, 
  FiUserCheck, 
  FiGrid, 
  FiCreditCard, 
  FiLogOut,
  FiX,
  FiShield,
  FiChevronsLeft,
  FiChevronsRight
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

/**
 * Sidebar - Backend bilan 100% mos
 * Collapse funksiyasi: button bosilganda kichrayib faqat iconlar ko'rinadi
 */

const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const getMenuItems = () => {
    const common = [
      { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
      { path: '/groups', icon: FiGrid, label: 'Guruhlar' },
    ];

    if (user?.role === 'ADMIN') {
      return [
        ...common,
        { path: '/students', icon: FiUsers, label: "O'quvchilar" },
        { path: '/teachers', icon: FiUserCheck, label: "O'qituvchilar" },
        { path: '/payments', icon: FiCreditCard, label: "To'lovlar" },
        { path: '/users', icon: FiShield, label: 'Foydalanuvchilar' },
      ];
    }

    if (user?.role === 'TEACHER') {
      return [
        ...common,
        { path: '/students', icon: FiUsers, label: "O'quvchilar" },
        { path: '/payments', icon: FiCreditCard, label: "To'lovlar" },
      ];
    }

    // STUDENT
    return [
      ...common,
      { path: '/payments', icon: FiCreditCard, label: "To'lovlar" },
    ];
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out lg:static lg:z-auto flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'lg:w-[72px] w-64' : 'w-64'}
        `}
      >
        {/* Header */}
        <div className={`flex items-center border-b border-gray-200 flex-shrink-0 ${
          collapsed ? 'lg:justify-center lg:px-2 px-4 py-4' : 'justify-between px-4 py-4'
        }`}>
          <div className={`flex items-center gap-2 ${collapsed ? 'lg:hidden flex' : 'flex'}`}>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="font-bold text-xl text-gray-800">Magistr</span>
          </div>

          {/* Collapsed: show only logo icon on desktop */}
          <div className={`${collapsed ? 'lg:flex hidden' : 'hidden'} items-center justify-center`}>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <FiX className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-3 space-y-1 overflow-y-auto ${collapsed ? 'lg:px-2 px-3' : 'px-3'}`}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-lg transition-all text-sm font-medium group relative
                  ${collapsed 
                    ? 'lg:justify-center lg:px-0 lg:py-2.5 px-4 py-2.5' 
                    : 'px-4 py-2.5'}
                  ${isActive
                    ? `bg-blue-50 text-blue-700 ${collapsed ? '' : 'border-l-4 border-blue-600 pl-3'}`
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span className={`${collapsed ? 'lg:hidden inline' : 'inline'}`}>{item.label}</span>
                
                {/* Tooltip on hover when collapsed */}
                {collapsed && (
                  <span className="hidden lg:group-hover:flex absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle Button - Desktop only */}
        <div className={`hidden lg:flex border-t border-gray-200 ${collapsed ? 'justify-center px-2 py-3' : 'px-3 py-3'}`}>
          <button
            onClick={onToggleCollapse}
            className={`flex items-center gap-3 w-full rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors
              ${collapsed ? 'justify-center px-0 py-2.5' : 'px-4 py-2.5'}`}
            title={collapsed ? 'Kengaytirish' : 'Qisqartirish'}
          >
            {collapsed ? (
              <FiChevronsRight className="h-5 w-5" />
            ) : (
              <>
                <FiChevronsLeft className="h-5 w-5" />
                <span>Qisqartirish</span>
              </>
            )}
          </button>
        </div>

        {/* User Info & Logout */}
        <div className={`border-t border-gray-200 flex-shrink-0 ${collapsed ? 'lg:px-2 px-3 py-3' : 'px-3 py-3'}`}>
          {/* User info - hidden when collapsed on desktop */}
          <div className={`flex items-center gap-3 px-3 py-2 mb-2 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden block' : 'block'}`}>
              <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName || 'Foydalanuvchi'}</p>
              <p className="text-xs text-gray-500">{user?.role || ''}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title={collapsed ? 'Chiqish' : undefined}
            className={`flex items-center gap-3 w-full text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors group relative
              ${collapsed ? 'lg:justify-center lg:px-0 lg:py-2.5 px-4 py-2.5' : 'px-4 py-2.5'}`}
          >
            <FiLogOut className="h-5 w-5 flex-shrink-0" />
            <span className={`${collapsed ? 'lg:hidden inline' : 'inline'}`}>Chiqish</span>
            
            {/* Tooltip when collapsed */}
            {collapsed && (
              <span className="hidden lg:group-hover:flex absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg">
                Chiqish
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;