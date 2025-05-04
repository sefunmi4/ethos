import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001',
});

export const signup = (data) => API.post('/signup', data);
export const login = (data) => API.post('/login', data);
export const getMe = (token) =>
  API.get('/me', { headers: { Authorization: `Bearer ${token}` } });