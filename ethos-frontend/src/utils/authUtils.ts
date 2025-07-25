// src/utils/authUtils.ts
import axios, { type AxiosInstance, AxiosError, type AxiosRequestConfig } from 'axios';

/**
 * 📡 Base API URL — should be environment-configurable
 */
const API_BASE =
  (typeof import.meta !== 'undefined'
    ? (import.meta as any).env?.VITE_API_URL
    : undefined) ||
  (typeof process !== 'undefined' ? process.env.VITE_API_URL : undefined) ||
  (typeof window !== 'undefined'
    ? `${window.location.origin}/api`
    : 'http://localhost:4173/api');

/**
 * 🔐 In-memory access token used for Authorization header
 */
let accessToken: string | null =
  typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

/**
 * Update stored access token and persist to localStorage
 */
export const setAccessToken = (token: string | null): void => {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) localStorage.setItem('accessToken', token);
    else localStorage.removeItem('accessToken');
  }
};

/**
 * Request a new access token using the refresh token cookie
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const res = await axiosWithAuth.post('/auth/refresh');
    if (res.data?.accessToken) {
      setAccessToken(res.data.accessToken);
      return res.data.accessToken as string;
    }
  } catch (err) {
    console.error('[AuthUtils] Failed to refresh token:', err);
  }
  return null;
};

/**
 * 🧠 Authenticated axios instance using cookie credentials
 */
export const axiosWithAuth: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Attach Authorization header with access token if available
axiosWithAuth.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Refresh the access token and retry once on 401 responses
axiosWithAuth.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return axiosWithAuth(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

/**
 * 🚪 Optional: Redirect-based logout helper
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await axiosWithAuth.post('/auth/logout');
    setAccessToken(null);
  } catch (err) {
    console.error('[AuthUtils] Logout failed:', err);
  } finally {
    window.location.href = '/login';
  }
};
