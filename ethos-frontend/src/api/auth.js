import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001',
});


export const signup = (email, password) =>
  API.post('/signup', { email, password });

export const login = async (email, password) => {
  const res = await axios.post('http://localhost:3001/login', { email, password });
  localStorage.setItem('token', res.data.token); // ✅ token must be saved
  return res.data;
};

export const getMe = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token found');
  
  const res = await axios.get('http://localhost:3001/me', {
    headers: {
      Authorization: `Bearer ${token}` // ✅ must include Bearer prefix
    }
  });

  return res.data;
};