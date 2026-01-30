import { useReducer, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { authReducer } from './AuthReducer';
import { authApi } from '../api/auth.api';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  initialized: false,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr && token !== 'undefined' && token !== 'null') {
        try {
          const user = JSON.parse(userStr);
          dispatch({
            type: 'INIT_COMPLETE',
            payload: { user, token },
          });
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({
            type: 'INIT_COMPLETE',
            payload: null,
          });
        }
      } else {
        dispatch({
          type: 'INIT_COMPLETE',
          payload: null,
        });
      }
    };
    
    initializeAuth();
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await authApi.login(credentials);
      // LoginResponse: { token, userId, email, fullName, role }
      const data = response.data;
      
      const token = data.token;
      
      if (!token) {
        throw new Error('Token not found in response');
      }

      const user = {
        userId: data.userId,
        email: data.email,
        fullName: data.fullName,
        role: data.role
      };
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token },
      });
      
      return { success: true };
      
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage,
      });
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    dispatch({ type: 'LOGOUT' });
    // authApi.logout is handled client side now
    // window.location.href = '/login'; // Let the protected route component handle redirect
  };

  const value = {
    ...state,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
