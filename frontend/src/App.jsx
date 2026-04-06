import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import { useAuthRefresh } from './hooks/useAuthRefresh';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorFallback from './components/ErrorFallback';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import TripDetail from './pages/TripDetail';

function AppRoutes() {
  useAuthRefresh(); // Start background silent refresh

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/onboarding" element={
        <ProtectedRoute>
          <Onboarding />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/trips/:tripId" element={
        <ProtectedRoute>
          <TripDetail />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => { window.location.href = '/'; }}
      >
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{
            duration: 5000,
            error: { duration: Infinity }, // Errors persist until dismissed (per D-04)
          }}
        />
        <AppRoutes />
      </ErrorBoundary>
    </BrowserRouter>
  );
}
