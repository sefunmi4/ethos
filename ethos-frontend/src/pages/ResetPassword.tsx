import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ChangeEvent, FormEvent } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
//import { usePermissions } from '../hooks/usePermissions';
import { useTimeline } from '../hooks/useTimeline';

import { updatePasswordViaToken } from '../api/auth';
import { ROUTES } from '../constants/routes';
import type { UserRole, AuthUser } from '../types/userTypes';

import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import AlertBox from '../components/ui/AlertBox';

interface PasswordForm {
  password: string;
  confirm: string;
}

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const { socket } = useSocket();
  const { setUser } = useAuth();
  //const { can } = usePermissions(); // 🔐 in case we restrict certain reset paths
  const { addTimelineEvent } = useTimeline();

  const [form, setForm] = useState<PasswordForm>({ password: '', confirm: '' });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (token) {
      socket?.emit('auth:reset-page-visited', { token });
    }
  }, [socket, token]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    if (form.password !== form.confirm) {
      setLoading(false);
      setError('Passwords do not match.');
      return;
    }
  
    if (!token) {
      setLoading(false);
      setError('Invalid or missing reset token.');
      return;
    }
  
    try {
      const allowedRoles: UserRole[] = ['user', 'admin', 'moderator'];

      const response = await updatePasswordViaToken(token, form.password);
      
      if (response?.user && response.user.id) {
        const rawUser = response.user;
      
        const role = allowedRoles.includes(rawUser.role as UserRole)
          ? (rawUser.role as UserRole)
          : undefined;
      
        const user: AuthUser = {
          ...rawUser,
          role,
        };
      
        setUser(user);
        socket?.emit('auth:password-reset-success', { userId: user.id });
        addTimelineEvent({
          userId: user.id,
          type: 'account',
          content: '🔐 Password reset successful',
        });
        setSuccess(true);
        setTimeout(() => navigate(ROUTES.LOGIN), 2000);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err: unknown) {
      console.error('[ResetPassword] Reset failed:', err);
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-soft dark:bg-soft-dark px-4">
      <section className="w-full max-w-md bg-surface dark:bg-surface p-8 rounded-lg shadow-lg text-primary">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-primary">Reset Your Password</h1>
          <p className="text-sm text-secondary mt-1">Enter and confirm your new password.</p>
        </header>

        {error && (
          <AlertBox type="error" message={error} className="mb-4" />
        )}

        {success && (
          <AlertBox
            type="success"
            message="Password reset successful. Redirecting to login..."
            className="mb-4"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="password"
            type="password"
            placeholder="New Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <Input
            name="confirm"
            type="password"
            placeholder="Confirm New Password"
            value={form.confirm}
            onChange={handleChange}
            required
          />
          <Button
            type="submit"
            disabled={loading}
            full
            variant={loading ? 'disabled' : 'primary'}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </section>
    </main>
  );
};

export default ResetPassword;