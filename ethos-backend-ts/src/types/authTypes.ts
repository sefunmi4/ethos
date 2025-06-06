import type { AuthUser } from './userTypes';

/**
 * Authentication context state and functions exposed to the app.
 */
export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;

  // Core auth actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  addUserAccount: (email: string, password: string) => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  
  // New: user account management
  updateUserInfo: (
    updates: Partial<Omit<AuthUser, 'id' | 'email' | 'role'>>
  ) => Promise<void>;
  archiveUserAccount: () => Promise<void>;
  deleteUserAccount: () => Promise<void>;
}