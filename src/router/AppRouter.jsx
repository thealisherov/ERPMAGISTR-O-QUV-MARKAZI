import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Login from '../pages/auth/Login';
import Layout from '../components/layout/Layout';
import Dashboard from '../pages/Dashboard';
import Students from '../pages/students/Students';
import StudentDetails from '../pages/students/StudentDetails';
import Teachers from '../pages/Teachers';
import TeacherDetails from '../pages/TeacherDetails';
import Groups from '../pages/Groups';
import GroupDetails from '../pages/groups/GroupDetails';
import Payments from '../pages/Payments';
import NotFound from '../pages/NotFound';
import Users from '../pages/Users';
import OrphanedStudents from '../pages/students/OrphanedStudents';

/**
 * App Router - Backend bilan 100% mos
 * 
 * Backend UserRole: ADMIN | TEACHER | STUDENT
 * 
 * Note: SUPER_ADMIN backendda yo'q, shuning uchun olib tashlandi.
 * Note: Branches, Expenses, Salary, Reports sahifalari backendda yo'q.
 */

const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
};

const RoleProtectedRoute = ({ element, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (user && allowedRoles.includes(user.role)) {
    return element;
  }
  
  return <Navigate to="/dashboard" replace />;
};

const RootRedirect = () => {
  const { loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return <Navigate to="/dashboard" replace />;
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <PrivateRoute />,
    children: [
      {
        index: true,
        element: <RootRedirect />,
      },
      {
        path: 'dashboard',
        element: <RoleProtectedRoute element={<Dashboard />} allowedRoles={['ADMIN', 'TEACHER', 'STUDENT']} />,
      },
      {
        path: 'students',
        element: <RoleProtectedRoute element={<Students />} allowedRoles={['ADMIN', 'TEACHER']} />,
      },
      {
        path: 'students/orphaned',
        element: <RoleProtectedRoute element={<OrphanedStudents />} allowedRoles={['ADMIN']} />,
      },
      {
        path: 'students/:id',
        element: <RoleProtectedRoute element={<StudentDetails />} allowedRoles={['ADMIN', 'TEACHER']} />,
      },
      {
        path: 'teachers',
        element: <RoleProtectedRoute element={<Teachers />} allowedRoles={['ADMIN']} />,
      },
      {
        path: 'teachers/:id',
        element: <RoleProtectedRoute element={<TeacherDetails />} allowedRoles={['ADMIN']} />,
      },
      {
        path: 'groups',
        element: <RoleProtectedRoute element={<Groups />} allowedRoles={['ADMIN', 'TEACHER', 'STUDENT']} />,
      },
      {
        path: 'groups/:id',
        element: <RoleProtectedRoute element={<GroupDetails />} allowedRoles={['ADMIN', 'TEACHER', 'STUDENT']} />,
      },
      {
        path: 'payments',
        element: <RoleProtectedRoute element={<Payments />} allowedRoles={['ADMIN', 'TEACHER', 'STUDENT']} />,
      },
      {
        path: 'users',
        element: <RoleProtectedRoute element={<Users />} allowedRoles={['ADMIN']} />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;