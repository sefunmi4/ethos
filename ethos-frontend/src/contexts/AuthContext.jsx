import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  forgotPassword,
} from '../api/auth';
import { getUserFromToken, axiosWithAuth } from '../utils/authUtils';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = async () => {
    try {
      const me = await getUserFromToken();
      setUser(me);
    } catch (err) {
      console.warn('[AuthContext] Fetch failed, trying refresh...');
      const refreshed = await tryRefreshAccessToken();
      if (refreshed) {
        const me = await getUserFromToken();
        setUser(me);
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const tryRefreshAccessToken = async () => {
    try {
      const res = await axiosWithAuth.post('/auth/refresh');
      return !!res?.data?.accessToken;
    } catch (err) {
      console.error('[AuthContext] Refresh failed:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email, password) => {
    try {
      await apiLogin(email, password);
      const me = await getUserFromToken();
      setUser(me);
    } catch (err) {
      throw new Error('Login failed');
    }
  };

  const register = async (email, password) => {
    try {
      await apiRegister(email, password);
      const me = await getUserFromToken();
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
      value={{
        user,
        loading,
        error,
        login,
        logout,
        register,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);