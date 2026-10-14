import { Platform } from 'react-native';
import { storage } from './storage';
import {
  ApiResponse,
  LoginCredentials,
  SignupCredentials,
  UpdateProfileData,
  CreateTodoData,
  UpdateTodoData,
  Todo,
  User,
  AppVersionInfo,
  PasswordItem,
  CreatePasswordData,
  UpdatePasswordData,
  PasswordStats,
} from '../types';

/**
 * Resolve API base URL with smart fallbacks
 */
const getDefaultApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }

  // Fallback to deployed production Render backend API
  return 'https://todo-application-f0yf.onrender.com/api';
};

export const API_BASE_URL = getDefaultApiUrl();

/**
 * Standard HTTP Request Wrapper with Auth Header, Timeout, and Network Error Catching
 */
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs = 12000
): Promise<ApiResponse<T>> {
  const token = await storage.getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        (data && data.message) ||
        `Request failed with status ${response.status} (${response.statusText})`;
      return {
        success: false,
        message: errorMessage,
      };
    }

    return data || { success: true };
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      return {
        success: false,
        message: `Connection timed out. Ensure the backend is running and reachable at ${API_BASE_URL}`,
      };
    }

    return {
      success: false,
      message:
        error.message === 'Network request failed'
          ? `Cannot connect to server at ${API_BASE_URL}. Verify your network connection and backend status.`
          : error.message || 'An unexpected network error occurred.',
    };
  }
}

/**
 * Centralized API Service
 */
export const api = {
  // Health
  checkHealth: async () => {
    return request('/health', { method: 'GET' });
  },

  // Auth Endpoints
  auth: {
    login: async (credentials: LoginCredentials) => {
      return request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },

    register: async (credentials: SignupCredentials) => {
      const { name, email, password } = credentials;
      return request<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
    },

    getMe: async () => {
      return request<{ user: User }>('/auth/me', {
        method: 'GET',
      });
    },
  },

  // User Profile Endpoints
  user: {
    getProfile: async () => {
      return request<{ user: User }>('/users/me', {
        method: 'GET',
      });
    },

    updateProfile: async (data: UpdateProfileData) => {
      return request<{ user: User }>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  },

  // Todo Endpoints
  todos: {
    getAll: async (completed?: boolean) => {
      const query = completed !== undefined ? `?completed=${completed}` : '';
      return request<Todo[]>(`/todos${query}`, {
        method: 'GET',
      });
    },

    getById: async (id: string) => {
      return request<Todo>(`/todos/${id}`, {
        method: 'GET',
      });
    },

    create: async (data: CreateTodoData) => {
      return request<Todo>('/todos', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: UpdateTodoData) => {
      return request<Todo>(`/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string) => {
      return request<{ id: string }>(`/todos/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // App Version & In-App Update
  version: {
    check: async () => {
      return request<AppVersionInfo>(
        '/app-version',
        {
          method: 'GET',
        },
        10000
      );
    },
  },

  // Password Vault Endpoints
  passwords: {
    getAll: async (category?: string, search?: string, favorite?: boolean) => {
      const params = new URLSearchParams();
      if (category && category !== 'all') params.append('category', category);
      if (search && search.trim()) params.append('search', search.trim());
      if (favorite !== undefined) params.append('favorite', String(favorite));

      const queryString = params.toString() ? `?${params.toString()}` : '';
      return request<PasswordItem[]>(`/passwords${queryString}`, {
        method: 'GET',
      });
    },

    getById: async (id: string) => {
      return request<PasswordItem>(`/passwords/${id}`, {
        method: 'GET',
      });
    },

    create: async (data: CreatePasswordData) => {
      return request<PasswordItem>('/passwords', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: UpdatePasswordData) => {
      return request<PasswordItem>(`/passwords/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string) => {
      return request<{ id: string }>(`/passwords/${id}`, {
        method: 'DELETE',
      });
    },
  },
};
