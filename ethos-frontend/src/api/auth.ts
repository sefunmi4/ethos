// src/api/auth.ts

import { axiosWithAuth } from '../utils/authUtils';
import type { User } from '../types/userTypes';

/**
 * @function addUserAccount
 * 🔐 Register a new user
 * @param email - User email
 * @param password - User password
 */
export const addUserAccount = async (email: string, password: string): Promise<void> => {
  await axiosWithAuth.post('/auth/register', { email, password });
};

/**
 * @function login
 * 🔑 Login and receive access token via secure cookie
 * @param email - User email
 * @param password - User password
 * @returns Access token
 */
export const login = async (
  email: string,
  password: string
): Promise<{ accessToken: string }> => {
  const res = await axiosWithAuth.post('/auth/login', { email, password });
  return res.data;
};

/**
 * @function logout
 * 🚪 Logout and clear the user's session cookie
 */
export const logout = async (): Promise<void> => {
  await axiosWithAuth.post('/auth/logout');
};

/**
 * @function fetchCurrentUser
 * 🧠 Retrieve authenticated user details
 * @returns Authenticated user data
 */
export const fetchCurrentUser = async (): Promise<User> => {
  const res = await axiosWithAuth.get('/auth/me');
  return res.data;
};

/**
 * @function addResetPasswordRequest
 * 🔁 Send password reset link to email
 * @param email - User email
 * @returns Message confirming email was sent
 */
export const addResetPasswordRequest = async (
  email: string
): Promise<{ message: string }> => {
  const res = await axiosWithAuth.post('/auth/forgot-password', { email });
  return res.data;
};

/**
 * @function updatePasswordViaToken
 * ✅ Submit token + new password for account recovery
 * @param token - Reset token sent via email
 * @param newPassword - New password
 * @returns User session info
 */
export const updatePasswordViaToken = async (
  token: string,
  newPassword: string
): Promise<{ user: User }> => {
  const res = await axiosWithAuth.post('/auth/forgot-password/confirm', {
    token,
    newPassword,
  });
  return res.data;
};

/**
 * @function updateUserInfo
 * ✏️ Edit the user's account information
 * @param updates - Partial user fields (bio, tags, links, etc.)
 * @returns Updated user profile
 */
export const updateUserInfo = async (
  updates: Partial<Omit<User, 'id' | 'email' | 'role'>>
): Promise<User> => {
  const res = await axiosWithAuth.patch('/auth/me', updates);
  return res.data;
};

/**
 * @function archiveUserAccount
 * 🗃 Soft-delete the user (downgraded to guest on login)
 * @returns Success status
 */
export const archiveUserAccount = async (): Promise<{ success: boolean }> => {
  const res = await axiosWithAuth.post('/auth/archive');
  return res.data;
};

/**
 * @function deleteUserAccount
 * ☠️ Permanently delete the user from the system
 * @returns Success status
 */
export const deleteUserAccount = async (): Promise<{ success: boolean }> => {
  const res = await axiosWithAuth.delete('/auth/me');
  return res.data;
};