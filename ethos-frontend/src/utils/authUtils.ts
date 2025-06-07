// src/utils/authUtils.ts
import axios, { type AxiosInstance } from 'axios';

/**
 * 📡 Base API URL — should be environment-configurable
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
    (config.headers as any).Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

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