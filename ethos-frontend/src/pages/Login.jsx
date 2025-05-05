import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getMe, signup } from '../api/auth';
import { AuthContext } from '../contexts/AuthContext';

//TODO: forgot password 
const Login = () => {
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [isRegistering, setIsRegistering] = useState(false);
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
      if (isRegistering) {
        if (form.password !== form.confirm) {
          setLoading(false);
          return setError('Passwords do not match');
        }
        await signup(form.email, form.password);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded shadow-md">
        <h2 className="text-2xl font-semibold text-center mb-6">
          {isRegistering ? 'Create an Account' : 'Welcome Back'}
        </h2>

        {error && (
          <div className="text-red-500 text-center mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded"
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded"
            required
          />

          {isRegistering && (
            <input
              name="confirm"
              type="password"
              placeholder="Confirm Password"
              value={form.confirm}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded"
              required
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded text-white transition ${
              loading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading
              ? isRegistering
                ? 'Registering...'
                : 'Logging in...'
              : isRegistering
              ? 'Register'
              : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          {isRegistering ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => setIsRegistering(false)}
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
                onClick={() => setIsRegistering(true)}
              >
                Register
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;