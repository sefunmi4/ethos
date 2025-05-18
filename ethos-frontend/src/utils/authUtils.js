// src/utils/authUtils.js
export const getUserFromToken = async () => {
  const token = localStorage.getItem('token');
  console.log('Token being used:', token); // 👈 Add this to verify
  if (!token) throw new Error('No token');

  const res = await fetch('http://localhost:3001/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Invalid token');

  return res.json(); // e.g. { email, role }
};