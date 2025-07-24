import React, { useContext, useEffect, useState } from 'react';
import type { AuthContextType } from '../types/authTypes';
import type { AuthUser } from '../types/userTypes';
import {
  login as apiLogin,
  logout as apiLogout,
  addUserAccount as apiRegister,
  fetchCurrentUser,
  updateUserInfo as apiUpdateUserInfo,
  archiveUserAccount as apiArchiveUser,
  deleteUserAccount as apiDeleteUser,
} from '../api/auth';
import { setAccessToken } from '../utils/authUtils';

import { AuthContext } from './AuthContextBase';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current user on initial load
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await fetchCurrentUser();
        setUser(userData as AuthUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      await apiLogin(email, password);
      const userData = await fetchCurrentUser();
      setUser(userData as AuthUser);
    } catch (err: unknown) {
      console.error('Login failed:', err);
      setError('Login failed');
      setUser(null);
      setAccessToken(null);
    }
  };

  const addUserAccount = async (email: string, password: string) => {
    try {
      setError(null);
      await apiRegister(email, password);
      const userData = await fetchCurrentUser();
      setUser(userData as AuthUser);
    } catch (err: unknown) {
      console.error('Registration failed:', err);
      setError('Registration failed');
      setUser(null);
      setAccessToken(null);
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
      setError('Logout failed');
    }
  };

  const updateUserInfo = async (
    updates: Partial<Omit<AuthUser, 'id' | 'email' | 'role'>>
  ) => {
    try {
      const updated = await apiUpdateUserInfo(updates);
      setUser(updated as AuthUser);
    } catch (err) {
      console.error('Failed to update user info:', err);
      setError('Failed to update profile');
    }
  };
  
  const archiveUserAccount = async () => {
    try {
      const res = await apiArchiveUser();
      if (res.success) setUser(null);
    } catch (err) {
      console.error('Failed to archive user:', err);
      setError('Account archive failed');
    }
  };
  
  const deleteUserAccount = async () => {
    try {
      const res = await apiDeleteUser();
      if (res.success) setUser(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Account deletion failed');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        error,
        login,
        logout,
        addUserAccount,
        updateUserInfo,
        archiveUserAccount,
        deleteUserAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
