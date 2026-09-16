const API_BASE = '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// Auth
export const auth = {
  login: (username: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<User>('/auth/me'),
};

// Apps
export const apps = {
  list: () => request<AppConfig[]>('/apps'),
  get: (id: number) => request<AppConfig>(`/apps/${id}`),
  create: (data: Partial<AppConfig>) =>
    request<AppConfig>('/apps', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<AppConfig>) =>
    request<AppConfig>(`/apps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<{ message: string }>(`/apps/${id}`, {
      method: 'DELETE',
    }),
};

// Users
export const users = {
  list: () => request<User[]>('/users'),
  create: (data: { username: string; password: string; role?: string }) =>
    request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: { username?: string; password?: string; role?: string }) =>
    request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),
};

// Launch
export const launch = {
  generate: (data: { exe_path: string; copies: number; method: string; delay: number }) =>
    request<{ script: string }>('/launch/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  history: () => request<LaunchHistory[]>('/launch/history'),
};

// Types
export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  created_at: string;
  config_count?: number;
  launch_count?: number;
}

export interface AppConfig {
  id: number;
  name: string;
  exe_path: string;
  method: 'simple' | 'sandbox' | 'copy' | 'env';
  copies: number;
  delay: number;
  created_by: number;
  created_by_username?: string;
  created_at: string;
}

export interface LaunchHistory {
  id: number;
  user_id: number;
  username?: string;
  app_config_id?: number;
  exe_path: string;
  copies: number;
  method: string;
  status: string;
  created_at: string;
}
