import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate } from 'react-router';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, setError } = useForm();
  const newPassword = watch('newPassword');

  const onSubmit = async ({ newPassword, confirmPassword }) => {
    if (!token) {
      setError('root', { message: 'Invalid reset link. Please request a new one.' });
      return;
    }
    try {
      // Backend auto-logs in after reset (D-07) — but we fetch user profile
      await api.post('/auth/reset-password', { token, newPassword });
      const profile = await api.get('/api/users/me');
      setUser(profile.data);
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.error || 'Reset failed. The link may have expired.';
      setError('root', { message });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">New password</h1>
          <p className="text-slate-500 mt-2">Choose a strong password</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              {...register('newPassword', { required: 'Password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' } })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
            {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              {...register('confirmPassword', { required: 'Please confirm your password', validate: (v) => v === newPassword || 'Passwords do not match' })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
          </div>

          {errors.root && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{errors.root.message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg py-2.5 transition-colors"
          >
            {isSubmitting ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
}
