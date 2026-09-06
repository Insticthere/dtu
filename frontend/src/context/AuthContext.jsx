import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('lm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('lm_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('lm_user', JSON.stringify(res.data.user));
          fetchNotificationCount();
        } catch (err) {
          console.error('Session check failed', err);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const fetchNotificationCount = async () => {
    try {
      const res = await api.get('/notifications');
      setUnreadNotifications(res.data.unreadCount || 0);
    } catch (err) {
      // Silent fail for notifs
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: loggedUser } = res.data;
    localStorage.setItem('lm_token', token);
    localStorage.setItem('lm_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    fetchNotificationCount();
    return loggedUser;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { token, user: registeredUser } = res.data;
    localStorage.setItem('lm_token', token);
    localStorage.setItem('lm_user', JSON.stringify(registeredUser));
    setUser(registeredUser);
    fetchNotificationCount();
    return registeredUser;
  };

  const logout = () => {
    localStorage.removeItem('lm_token');
    localStorage.removeItem('lm_user');
    setUser(null);
    setUnreadNotifications(0);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      unreadNotifications,
      fetchNotificationCount
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
