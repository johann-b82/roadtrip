import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export function useAuthRefresh() {
  const { isAuthenticated, clearUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Refresh every 14 minutes (access token expires at 15min)
    const interval = setInterval(async () => {
      try {
        await api.post('/auth/refresh');
      } catch {
        clearUser();
        navigate('/login?expired=true');
      }
    }, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, clearUser, navigate]);
}
