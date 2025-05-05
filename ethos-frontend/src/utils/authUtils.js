// src/utils/authUtils.js
export const getUserFromToken = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token');

  const res = await fetch('http://localhost:3001/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Invalid token');

  return res.json(); // e.g. { email, role }
};