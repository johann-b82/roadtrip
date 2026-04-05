import { useState } from 'react';
import { useNavigate } from 'react-router';
import AddressInput from '../components/AddressInput';
import MapPreview from '../components/MapPreview';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [selected, setSelected] = useState(null); // { address, lat, lon }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSelect = (location) => {
    setSelected(location);
    setError('');
  };

  const handleSave = async () => {
    if (!selected) {
      setError('Please search for and select an address first.');
      return;
    }
    setSaving(true);
    try {
      const response = await api.put('/api/users/me/home-location', {
        address: selected.address,
        lat: selected.lat,
        lon: selected.lon,
      });
      setUser({ ...user, ...response.data });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save home location. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    // D-10: skippable — gentle nudge in button text, not blocking
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Where do you call home?</h1>
          <p className="text-slate-500 mt-2">
            Set your home location to use as the starting point for your road trips.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Home address</label>
            <AddressInput
              onSelect={handleSelect}
              placeholder="Search for your city or address..."
            />
          </div>

          {selected && (
            <MapPreview
              lat={selected.lat}
              lon={selected.lon}
              address={selected.address}
            />
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !selected}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg py-2.5 transition-colors"
          >
            {saving ? 'Saving...' : 'Set home location'}
          </button>

          <button
            onClick={handleSkip}
            className="w-full text-slate-500 hover:text-slate-700 text-sm py-2 transition-colors"
          >
            Skip for now — you can set this later
          </button>
        </div>
      </div>
    </div>
  );
}
