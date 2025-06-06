// src/utils/authUtils.ts
import axios, { type AxiosInstance } from 'axios';

/**
 * 📡 Base API URL — should be environment-configurable
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * 🧠 Authenticated axios instance using cookie credentials
 */
export const axiosWithAuth: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

/**
 * 🚪 Optional: Redirect-based logout helper
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await axiosWithAuth.post('/auth/logout');
  } catch (err) {
    console.error('[AuthUtils] Logout failed:', err);
  } finally {
    window.location.href = '/login';
  }
};