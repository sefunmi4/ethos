import { axiosWithAuth } from '../utils/authUtils';

/** 🔐 Register new user */
export const register = (email, password) => {
  return axiosWithAuth.post('/auth/register', { email, password });
};

/** 🔑 Login — sets HTTP-only cookie on server */
export const login = async (email, password) => {
  const res = await axiosWithAuth.post('/auth/login', { email, password });
  return res.data;
};

/** 🚪 Logout — clears cookie */
export const logout = async () => {
  return axiosWithAuth.post('/auth/logout');
};

/** 🛠 Forgot password */
export const forgotPassword = async (email) => {
  const res = await axiosWithAuth.post('/auth/forgot-password', { email });
  return res.data;
};

/** 🧠 Get current user using cookie */
export const getMe = async () => {
  const res = await axiosWithAuth.get('/auth/me'); // ✅ uses cookie
  return res.data;
};