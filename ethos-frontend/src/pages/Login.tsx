// src/pages/Login.tsx
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, fetchCurrentUser, addUserAccount, addResetPasswordRequest } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import type { AuthUser } from '../types/userTypes';
import { useSocket } from '../hooks/useSocket';
import { useBoard } from '../hooks/useBoard';
import { usePermissions } from '../hooks/usePermissions';
import { usePost } from '../hooks/usePost';
import { useQuest } from '../hooks/useQuest';
import { useTimeline } from '../hooks/useTimeline';
import { useGraph } from '../hooks/useGraph';


// Type guard to validate layout of user object
const isValidAuthUser = (data: any): data is AuthUser => {
  return data && typeof data.id === 'string' && typeof data.email === 'string';
};

// Define form state type
interface AuthForm {
  email: string;
  password: string;
  confirm: string;
}

const Login: React.FC = () => {
  const [form, setForm] = useState<AuthForm>({ email: '', password: '', confirm: '' });
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [showReset, setShowReset] = useState<boolean>(false);
  const [resetSent, setResetSent] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const { setUser } = useAuth();
  const { socket, connect } = useSocket();
  const { setSelectedBoard, fetchBoards } = useBoard();
  const { loadPermissions } = usePermissions();
  const { fetchPostsForBoard } = usePost();
  const { fetchQuestsForBoard } = useQuest();
  const { loadTimeline } = useTimeline();
  const { loadGraph } = useGraph();

  const navigate = useNavigate();

  // Handles input field changes
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handles login/register/reset submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    try {
      if (showReset) {
        await addResetPasswordRequest(form.email);
        setResetSent(true);
        return;
      }
  
      if (isRegistering) {
        if (form.password !== form.confirm) {
          return setError('Passwords do not match');
        }
        await addUserAccount(form.email, form.password);
      }
  
      await login(form.email, form.password);
      const user = await fetchCurrentUser();
  
      // ✅ Validate response before setting user
      if (isValidAuthUser(user)) {
        setUser(user);
      
        // 👣 Post-login ecosystem setup
        connect(); // 👈 Instead of socket.connect()
        socket.emit('user_connected', { userId: user.id });
      
        // 🔁 Sync boards
        const userBoards = await fetchBoards(user.id);
        const defaultBoard =
          userBoards.find(b => b.defaultFor === 'home') || userBoards[0];
        if (defaultBoard) {
          setSelectedBoard(defaultBoard.id);
          
          await Promise.all([
            loadPermissions(defaultBoard.id),
            fetchPostsForBoard(defaultBoard.id),
            fetchQuestsForBoard(defaultBoard.id),
            loadTimeline(defaultBoard.id),
            loadGraph(defaultBoard.id),
          ]);
        }
      
        navigate('/');
      } else {
        throw new Error('Invalid user response from fetchCurrentUser');
      }
    } catch (err: any) {
      console.error('Auth failed:', err);
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resets the form to login state
  const resetToLogin = () => {
    setShowReset(false);
    setIsRegistering(false);
    setResetSent(false);
    setError('');
    setForm({ email: '', password: '', confirm: '' });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <section className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800">
            {showReset
              ? 'Reset Password'
              : isRegistering
              ? 'Create an Account'
              : 'Welcome Back'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {showReset
              ? 'Enter your email to receive a reset link.'
              : isRegistering
              ? 'Join the platform today.'
              : 'Login to continue your quest.'}
          </p>
        </header>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-300 rounded p-2 mb-4">
            {error}
          </div>
        )}

        {resetSent && showReset && (
          <div className="text-sm text-green-600 bg-green-50 border border-green-300 rounded p-2 mb-4">
            Password reset instructions sent to your email.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {!showReset && (
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          )}

          {isRegistering && !showReset && (
            <input
              name="confirm"
              type="password"
              placeholder="Confirm Password"
              value={form.confirm}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded font-semibold text-white transition ${
              loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading
              ? showReset
                ? 'Sending...'
                : isRegistering
                ? 'Registering...'
                : 'Logging in...'
              : showReset
              ? 'Send Reset Link'
              : isRegistering
              ? 'Register'
              : 'Login'}
          </button>
        </form>

        {!showReset && !isRegistering && (
          <div className="text-right mt-2">
            <button
              type="button"
              className="text-blue-500 text-sm hover:underline"
              onClick={() => {
                setShowReset(true);
                setError('');
              }}
            >
              Forgot password?
            </button>
          </div>
        )}

        <footer className="mt-6 text-center text-sm text-gray-600">
          {showReset ? (
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={resetToLogin}
            >
              Back to login
            </button>
          ) : isRegistering ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => {
                  setIsRegistering(false);
                  setError('');
                }}
              >
                Log in
              </button>
            </p>
          ) : (
            <p>
              Don’t have an account?{' '}
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => {
                  setIsRegistering(true);
                  setError('');
                }}
              >
                Register
              </button>
            </p>
          )}
        </footer>
      </section>
    </main>
  );
};

export default Login;