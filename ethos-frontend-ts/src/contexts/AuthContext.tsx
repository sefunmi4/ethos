import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
} from '../api/auth';

import {
  getUserFromToken,
  axiosWithAuth,
} from '../utils/authUtils';

import type { AuthUser, AuthContextType } from '../types/authTypes';

/**
 * Runtime validator to ensure data conforms to the AuthUser interface.
 */
const isValidAuthUser = (data: any): data is AuthUser => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.email === 'string'
  );
};

/**
 * Default authentication context placeholder before initialization.
 */
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
 * React context object for authentication state and actions.
 */
export const AuthContext = createContext<AuthContextType>(defaultContext);

/**
 * AuthProvider component wraps the app and supplies authentication state.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Attempts to fetch the current user from a stored token.
   * Falls back to refreshing the access token if expired.
   */
  const fetchUser = async () => {
    try {
      const me = await getUserFromToken();
      if (isValidAuthUser(me)) {
        setUser(me);
        console.info('[AuthContext] User loaded:', me);
      } else {
        throw new Error('Invalid user data received');
      }
    } catch (err) {
      console.warn('[AuthContext] Token invalid. Attempting refresh...');
      const refreshed = await tryRefreshAccessToken();
      if (refreshed) {
        try {
          const me = await getUserFromToken();
          if (isValidAuthUser(me)) {
            setUser(me);
            console.info('[AuthContext] User reloaded after refresh:', me);
          } else {
            console.warn('[AuthContext] User invalid after refresh');
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      } else {
        console.warn('[AuthContext] Refresh failed. Clearing auth state.');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Requests a new access token using the refresh token.
   */
  const tryRefreshAccessToken = async (): Promise<boolean> => {
    try {
      const res = await axiosWithAuth.post('/auth/refresh');
      return !!res?.data?.accessToken;
    } catch (err) {
      console.error('[AuthContext] Token refresh error:', err);
      return false;
    }
  };

  /**
   * Initializes authentication by checking the existing token.
   */
  useEffect(() => {
    fetchUser();
  }, []);

  /**
   * Logs the user in and updates auth state.
   */
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      await apiLogin(email, password);
      const me = await getUserFromToken();
      if (isValidAuthUser(me)) {
        setUser(me);
        setError(null);
        console.info('[AuthContext] Login successful:', me);
      } else {
        throw new Error('Invalid login response');
      }
    } catch (err) {
      console.error('[AuthContext] Login error:', err);
      setError('Login failed. Please check your credentials.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Registers a new user and sets auth state upon success.
   */
  const register = async (email: string, password: string) => {
    try {
      setLoading(true);
      await apiRegister(email, password);
      const me = await getUserFromToken();
      if (isValidAuthUser(me)) {
        setUser(me);
        setError(null);
        console.info('[AuthContext] Registration successful:', me);
      } else {
        throw new Error('Invalid registration response');
      }
    } catch (err) {
      console.error('[AuthContext] Registration error:', err);
      setError('Registration failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logs the user out and resets the auth state.
   */
  const logout = async () => {
    try {
      await apiLogout();
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
 * Hook for accessing the AuthContext in components.
 */
export const useAuth = (): AuthContextType => useContext(AuthContext);