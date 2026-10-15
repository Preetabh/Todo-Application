import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, SignupCredentials } from '../types';
import { storage } from '../services/storage';
import { api } from '../services/api';
import {
  registerForPushNotificationsAsync,
  unregisterPushTokenAsync,
} from '../services/pushNotification';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string }>;
  register: (credentials: SignupCredentials) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on app launch
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await storage.getToken();
        const storedUser = await storage.getUser();

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);

          // Verify token against backend in background
          api.auth
            .getMe()
            .then((res) => {
              if (res.success && res.user) {
                setUser(res.user);
                storage.setUser(res.user);
                // Sync push notifications on active session
                registerForPushNotificationsAsync().catch(() => {});
              } else if (!res.success && res.message?.includes('token')) {
                // Token invalid or expired
                logout();
              }
            })
            .catch(() => {
              // Ignore network failure on startup, keep cached user
            });
        }
      } catch (error) {
        console.warn('Failed to restore auth session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const res = await api.auth.login(credentials);

    if (res.success && res.token && res.user) {
      await storage.setToken(res.token);
      await storage.setUser(res.user);
      setToken(res.token);
      setUser(res.user);

      // Register device push token for authenticated user
      registerForPushNotificationsAsync().catch((err) => {
        console.warn('Push registration error post-login:', err);
      });

      return { success: true };
    }

    return {
      success: false,
      message: res.message || 'Login failed. Please check your credentials.',
    };
  };

  const register = async (credentials: SignupCredentials) => {
    const res = await api.auth.register(credentials);

    if (res.success && res.token && res.user) {
      await storage.setToken(res.token);
      await storage.setUser(res.user);
      setToken(res.token);
      setUser(res.user);

      // Register device push token for new user
      registerForPushNotificationsAsync().catch((err) => {
        console.warn('Push registration error post-signup:', err);
      });

      return { success: true };
    }

    return {
      success: false,
      message: res.message || 'Registration failed.',
    };
  };

  const logout = async () => {
    await unregisterPushTokenAsync().catch(() => {});
    await storage.clearAll();
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedFields: Partial<User>) => {
    if (user) {
      const merged = { ...user, ...updatedFields };
      setUser(merged);
      storage.setUser(merged);
    }
  };

  const refreshUser = async () => {
    const res = await api.user.getProfile();
    if (res.success && res.user) {
      setUser(res.user);
      await storage.setUser(res.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
