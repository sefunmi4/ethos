// src/utils/authUtils.ts
import axios, { type AxiosInstance, AxiosError, type AxiosRequestConfig } from 'axios';

// These globals are replaced at build time by Vite's `define`
// and help when `import.meta.env` is not available (e.g. tests)
declare const VITE_API_URL: string | undefined;

/**
 * 📡 Base API URL — should be environment-configurable
 */
// Resolve the base API URL from multiple environments
const rawBase =
  // Prefer the compile-time define if present
  (typeof VITE_API_URL !== 'undefined' && VITE_API_URL) ||
  // Then fall back to Vite's runtime import.meta.env
  (import.meta as any)?.env?.VITE_API_URL ||
  // Or Node's process.env when running outside the browser
  (typeof process !== 'undefined' ? process.env?.VITE_API_URL : undefined) ||
  // Finally default to the current window origin in dev
  (typeof window !== 'undefined'
    ? `${window.location.origin}/api`
    : 'http://localhost:4173/api');

// Ensure the base URL always ends with a trailing slash so relative
// request paths concatenate correctly
export const API_BASE = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

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
    const res = await axiosWithAuth.post('auth/refresh');
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
  // Strip any leading slash so URLs remain relative to API_BASE
  if (config.url?.startsWith('/')) {
    config.url = config.url.slice(1);
  }
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
      !originalRequest.url?.includes('auth/refresh')
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
    await axiosWithAuth.post('auth/logout');
    setAccessToken(null);
  } catch (err) {
    console.error('[AuthUtils] Logout failed:', err);
  } finally {
    window.location.href = '/login';
  }
};
