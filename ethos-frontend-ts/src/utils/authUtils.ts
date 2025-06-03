import axios, { type AxiosInstance } from 'axios';
import type { AuthUser } from '../types/authTypes';

/**
 * 📡 Base API URL — should be environment-configurable in production
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * 🧠 Axios instance configured for authenticated requests.
 * Automatically sends HTTP-only cookies (e.g., refresh tokens).
 */
export const axiosWithAuth: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // ✅ Required to send cookies with requests
});

/**
 * 🚪 Logs out the user by calling the `/auth/logout` endpoint.
 * Also forces a client-side redirect to the login page.
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await axiosWithAuth.post('/auth/logout');
  } catch (err) {
    console.error('[AuthUtils] Logout failed:', err);
  } finally {
    window.location.href = '/login'; // Force redirect after logout
  }
};

/**
 * 👤 Retrieves the currently authenticated user's data from the `/auth/me` endpoint.
 * Uses cookies for authentication and validates the structure before returning.
 *
 * @returns AuthUser object if valid; otherwise, `null`.
 */
export const getUserFromToken = async (): Promise<AuthUser | null> => {
  try {
    const res = await axiosWithAuth.get('/auth/me');
    const user = res.data;

    // Basic structural validation
    if (!user || typeof user !== 'object') return null;
    if (typeof user.id !== 'string' || typeof user.email !== 'string') return null;

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      ...user, // Include other optional fields like links, tags, etc.
    };

    return authUser;
  } catch (err) {
    console.error('[AuthUtils] Failed to fetch user from token:', err);
    return null;
  }
};