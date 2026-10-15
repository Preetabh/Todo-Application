import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi';

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('digent_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('digent_admin_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('digent_admin_token');
      if (storedToken) {
        try {
          const res = await adminApi.getMe();
          if (res.success && res.user && res.user.role === 'admin') {
            setAdmin(res.user);
            localStorage.setItem('digent_admin_user', JSON.stringify(res.user));
          } else {
            logout();
          }
        } catch {
          // Keep cached admin if network fails temporarily
        }
      }
      setIsLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (email, password) => {
    const res = await adminApi.login(email, password);
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setAdmin(res.user);
      localStorage.setItem('digent_admin_token', res.token);
      localStorage.setItem('digent_admin_user', JSON.stringify(res.user));
      return { success: true };
    }
    return {
      success: false,
      message: res.message || 'Login failed. Please verify your administrative credentials.',
    };
  };

  const logout = async () => {
    try {
      await adminApi.logout();
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem('digent_admin_token');
    localStorage.removeItem('digent_admin_user');
    setToken(null);
    setAdmin(null);
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await adminApi.changePassword(currentPassword, newPassword);
    if (res.success) {
      if (admin) {
        const updated = { ...admin, mustChangePassword: false };
        setAdmin(updated);
        localStorage.setItem('digent_admin_user', JSON.stringify(updated));
      }
      return { success: true, message: res.message };
    }
    return {
      success: false,
      message: res.message || 'Failed to update password.',
    };
  };

  const refreshAdmin = async () => {
    const res = await adminApi.getMe();
    if (res.success && res.user) {
      setAdmin(res.user);
      localStorage.setItem('digent_admin_user', JSON.stringify(res.user));
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: !!token && !!admin,
        isLoading,
        login,
        logout,
        changePassword,
        refreshAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
