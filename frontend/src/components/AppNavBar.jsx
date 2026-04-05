import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function AppNavBar() {
  const navigate = useNavigate();
  const { user, clearUser } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } catch (_) { /* ignore */ }
    clearUser();
    navigate('/login');
  }

  const initials = user?.email ? user.email[0].toUpperCase() : '?';

  return (
    <nav className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
      {/* Logo / App name */}
      <button
        onClick={() => navigate('/dashboard')}
        className="text-xl font-semibold text-slate-800 hover:text-blue-600 transition-colors"
      >
        RoadTrip
      </button>

      {/* User avatar + menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center hover:bg-blue-700 transition-colors"
          aria-label="User menu"
        >
          {initials}
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
            <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-100 truncate">
              {user?.email}
            </div>
            <button
              onClick={() => { setMenuOpen(false); navigate('/onboarding'); }}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
