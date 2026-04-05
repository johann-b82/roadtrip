import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useAuthRefresh } from './hooks/useAuthRefresh';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

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
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <p className="text-slate-600">Onboarding — coming in Plan 05</p>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <p className="text-slate-600">Dashboard — coming in Phase 2</p>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
