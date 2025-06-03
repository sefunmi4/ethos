import { axiosWithAuth } from '../utils/authUtils';

/**
 * 🔐 Register a new user
 * @param email - Email address
 * @param password - User password
 * @returns Axios response Promise
 */
export const register = (email: string, password: string): Promise<void> => {
  return axiosWithAuth.post('/auth/register', { email, password });
};

/**
 * 🔑 Login the user and receive a server-issued token (via HTTP-only cookie)
 * @param email - User email
 * @param password - User password
 * @returns Access token data (if returned)
 */
export const login = async (
  email: string,
  password: string
): Promise<{ accessToken: string }> => {
  const res = await axiosWithAuth.post('/auth/login', { email, password });
  return res.data;
};

/**
 * 🚪 Logout the user and clear authentication cookies
 * @returns A Promise indicating the logout result
 */
export const logout = async (): Promise<void> => {
  await axiosWithAuth.post('/auth/logout');
};

/**
 * 🛠 Send password reset email
 * @param email - Email to send reset link to
 * @returns Message response
 */
export const forgotPassword = async (
  email: string
): Promise<{ message: string }> => {
  const res = await axiosWithAuth.post('/auth/forgot-password', { email });
  return res.data;
};

/**
 * 🧠 Get the currently authenticated user using cookie token
 * @returns User profile object
 */
export interface MeResponse {
  id: string;
  username: string;
  role: string;
  tags: string[];
  bio: string;
  links: {
    github: string;
    linkedin: string;
    tiktok: string;
    website: string;
  };
  experienceTimeline: {
    datetime: string;
    title: string;
    tags: string[];
  }[];
}

export const getMe = async (): Promise<MeResponse> => {
  const res = await axiosWithAuth.get('/auth/me');
  return res.data;
};