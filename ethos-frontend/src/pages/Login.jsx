import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getMe, register, forgotPassword } from '../api/auth';
import { AuthContext } from '../contexts/AuthContext';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (showReset) {
        await forgotPassword(form.email);
        setResetSent(true);
        setLoading(false);
        return;
      }

      if (isRegistering) {
        if (form.password !== form.confirm) {
          setLoading(false);
          return setError('Passwords do not match');
        }
        await register(form.email, form.password);
      }

      await login(form.email, form.password);
      const user = await getMe();
      setUser(user);
      navigate('/');
    } catch (err) {
      console.error('Auth failed:', err);
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

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