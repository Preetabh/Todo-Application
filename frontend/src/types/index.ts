export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Todo {
  _id: string;
  user: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TodoStats {
  total: number;
  pending: number;
  completed: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  stats?: TodoStats;
  token?: string;
  user?: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
}

export interface CreateTodoData {
  title: string;
  description?: string;
  completed?: boolean;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  completed?: boolean;
}

export interface AppVersionInfo {
  latestVersion: string;
  minimumVersion: string;
  apkUrl: string;
  updateMessage?: string;
  forceUpdate?: boolean;
  releaseDate?: string;
  fileSizeBytes?: number | null;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  isForced: boolean;
  currentVersion: string;
  latestVersion: string;
  minimumVersion: string;
  apkUrl: string;
  updateMessage?: string;
  releaseDate?: string;
  fileSizeBytes?: number | null;
}
