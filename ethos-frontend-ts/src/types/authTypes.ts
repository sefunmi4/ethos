import type { User, UserRole } from './userTypes';

/**
 * Represents a simplified or partial version of a user for auth sessions.
 * Includes extensions like `name` or session-specific metadata.
 */
export interface AuthUser extends Partial<Omit<User, 'role'>> {
  /**
   * Unique user ID — always required in auth context.
   */
  id: string;

  /**
   * Registered email address — always required.
   */
  email: string;

  /**
   * Optional display name for personalization.
   */
  name?: string;

  /**
   * Optional role — only valid roles allowed.
   */
  role?: UserRole;

  /**
   * Optional session or provider-specific data.
   */
  [key: string]: any;
}

/**
 * Authentication context state and functions exposed to the app.
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