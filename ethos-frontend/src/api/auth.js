import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001/api/auth',
});

// ✅ Use shared instance for register
export const register = (email, password) =>
  API.post('/register', { email, password });

// ✅ Use shared instance for login
export const login = async (email, password) => {
  const res = await API.post('/login', { email, password });
  localStorage.setItem('token', res.data.accessToken); // ✅ correct field
  return res.data;
};

export const logout = async () => {
  return fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
};

export const forgotPassword = async (email) => {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to send reset link');
  }

  return res.json();
};

// ✅ Use shared instance for getMe
export const getMe = async () => {
  const token = localStorage.getItem('token');
  console.log('Token being used:', token); // 👈 Add this
  
  if (!token) throw new Error('No token found');

  const res = await API.get('/me', {
    headers: {
      Authorization: `Bearer ${token}`
    },
  });

  return res.data;
};