import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { setUser, clearUser } = useAuthStore();
  const navigate = useNavigate();

  const signup = useCallback(async ({ email, password, confirmPassword }) => {
    const response = await api.post('/auth/signup', { email, password, confirmPassword });
    setUser(response.data);
    navigate('/onboarding');
    return response.data;
  }, [setUser, navigate]);

  const login = useCallback(async ({ email, password }) => {
    const response = await api.post('/auth/login', { email, password });
    setUser(response.data);
    // Fetch full profile including home location
    const profile = await api.get('/api/users/me');
    setUser(profile.data);
    navigate('/dashboard');
    return profile.data;
  }, [setUser, navigate]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearUser();
      navigate('/login');
    }
  }, [clearUser, navigate]);

  const getMe = useCallback(async () => {
    try {
      const response = await api.get('/api/users/me');
      setUser(response.data);
      return response.data;
    } catch {
      clearUser();
      return null;
    }
  }, [setUser, clearUser]);

  return { signup, login, logout, getMe };
}
