// src/utils/passwordUtils.ts

import bcrypt from 'bcryptjs';

/**
 * Hash a plaintext password using bcrypt
 * @param password - Plain text password
 * @returns A promise that resolves to the hashed password
 */
export const hashPassword = (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

/**
 * Compare a plaintext password to a stored hash
 * @param input - Plain text password entered by user
 * @param hash - Hashed password from the database
 * @returns A promise that resolves to a boolean indicating if the passwords match
 */
export const comparePasswords = (
  input: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(input, hash);
};