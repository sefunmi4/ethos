import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { axiosWithAuth } from '../utils/authUtils';


const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (form.password !== form.confirm) {
      setLoading(false);
      return setError('Passwords do not match.');
    }

    try {
      await axiosWithAuth.post(`/api/auth/reset-password/${token}`, {
        password: form.password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Reset failed:', err);
      setError(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <section className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Reset Your Password</h1>
          <p className="text-sm text-gray-500 mt-1">Enter and confirm your new password.</p>
        </header>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-300 rounded p-2 mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="text-sm text-green-600 bg-green-50 border border-green-300 rounded p-2 mb-4">
            Password reset successful. Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="password"
            type="password"
            placeholder="New Password"
            value={form.password}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            name="confirm"
            type="password"
            placeholder="Confirm New Password"
            value={form.confirm}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded font-semibold text-white transition ${
              loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </section>
    </main>
  );
};

export default ResetPassword;