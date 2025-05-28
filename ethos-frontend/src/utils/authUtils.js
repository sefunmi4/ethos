import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

/** 🧠 Authenticated Axios instance with cookie support */
export const axiosWithAuth = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // ✅ always send cookies
});

/** 🚪 Logout user and redirect */
export const logoutUser = async () => {
  try {
    await axiosWithAuth.post('/auth/logout');
  } catch (err) {
    console.error('Logout failed:', err);
  } finally {
    window.location.href = '/login'; // Always redirect
  }
};

/** 👤 Get current user (relies on HTTP-only cookie) */
export const getUserFromToken = async () => {
  try {
    const res = await axiosWithAuth.get(`/auth/me`);
    return res.data;
  } catch (err) {
    console.error('Auth check failed:', err);
    return null;
  }
};