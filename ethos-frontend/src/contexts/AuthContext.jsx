import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  getMe,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
} from '../api/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const me = await getMe();
        setUser(me);
      } catch (err) {
        console.warn('No active session');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      await apiLogin(email, password);
      const me = await getMe();
      setUser(me);
    } catch (err) {
      throw new Error('Login failed');
    }
  };

  const register = async (email, password) => {
    try {
      await apiRegister(email, password);
      const me = await getMe();
      setUser(me);
    } catch (err) {
      throw new Error('Registration failed');
    }
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, login, logout, register, loading, error }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);