import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
  
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
} from '../api/auth';

import { getUserFromToken, axiosWithAuth } from '../utils/authUtils';

/**
 * Interface representing the authenticated user.
 */
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  [key: string]: any;
}

/**
 * Interface for AuthContext value
 */
export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
}

const defaultContext: AuthContextType = {
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  setUser: () => {},
};

/**
 * React context for managing user authentication state and actions.
 */
export const AuthContext = createContext<AuthContextType>(defaultContext);

/**
 * AuthProvider wraps your app and provides authentication state via context.
 * It attempts to hydrate the user from cookies on mount.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      const me = await getUserFromToken();
      setUser(me);
      console.info('[AuthContext] User loaded:', me);
    } catch (err) {
      console.warn('[AuthContext] Failed to load user, attempting refresh...');
      const refreshed = await tryRefreshAccessToken();
      if (refreshed) {
        const me = await getUserFromToken();
        setUser(me);
        console.info('[AuthContext] User reloaded after refresh:', me);
      } else {
        setUser(null);
        console.warn('[AuthContext] Could not refresh token. User set to null.');
      }
    } finally {
      setLoading(false);
    }
  };

  const tryRefreshAccessToken = async (): Promise<boolean> => {
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

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      await apiLogin(email, password); // should set cookie via backend
      const me = await getUserFromToken();
      setUser(me);
      console.info('[AuthContext] Login successful:', me);
    } catch (err) {
      console.error('[AuthContext] Login failed:', err);
      setError('Login failed. Please check your credentials.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setLoading(true);
      await apiRegister(email, password);
      const me = await getUserFromToken();
      setUser(me);
      console.info('[AuthContext] Registration successful:', me);
    } catch (err) {
      console.error('[AuthContext] Registration failed:', err);
      setError('Registration failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiLogout(); // should clear cookies
      setUser(null);
      console.info('[AuthContext] Logged out successfully');
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
    }
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

/**
 * useAuth is a helper hook to access AuthContext
 */
export const useAuth = () => useContext(AuthContext);