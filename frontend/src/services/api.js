import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  withCredentials: true, // Sends httpOnly cookies automatically
});

// Global error interceptor — turns API errors into toast notifications (per D-04)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Network error';
    const status = error.response?.status;

    if (status === 401) {
      toast.error('Session expired. Please log in again.');
      window.location.href = '/login';
    } else if (status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (status === 404) {
      // 404s are often expected (e.g., no route found) — let callers handle silently
    } else if (error.request && !error.response) {
      // Network error (no response received)
      toast.warning('Network error. Check your connection.', { duration: 5000 });
    } else if (status >= 400) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
