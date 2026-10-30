import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('erp_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('erp_token') || null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_user');
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (localStorage.getItem('erp_token')) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('erp_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.error('[Auth check failed]', err);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [logout]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: authToken, user: authUser } = res.data;
      setToken(authToken);
      setUser(authUser);
      localStorage.setItem('erp_token', authToken);
      localStorage.setItem('erp_user', JSON.stringify(authUser));
      return authUser;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
