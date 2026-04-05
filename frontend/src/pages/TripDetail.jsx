import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTrip } from '../hooks/useTrip';
import AppNavBar from '../components/AppNavBar';
import StopList from '../components/StopList';
import MapPreview from '../components/MapPreview';

// Inline ConfirmDialog (same pattern as Dashboard — plan 06 extracts shared component)
function ConfirmDialog({ title, message, confirmText, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-2">{title}</h2>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Stop list skeleton (2-3 items per UI-SPEC)
function StopSkeleton() {
  return (
    <div className="animate-pulse space-y-3 px-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex gap-3">
            <div className="w-7 h-7 bg-slate-200 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { trip, stops, isLoading, error, addStop, editStop, removeStop, reorderStops } = useTrip(tripId);
  const [deletingStop, setDeletingStop] = useState(null);
  const [toast, setToast] = useState(null);

  function showToast(message, type = 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }

  async function handleDeleteStop() {
    if (!deletingStop) return;
    try {
      await removeStop(deletingStop.id);
      setDeletingStop(null);
    } catch (err) {
      showToast('Failed to delete stop. Please try again.');
      setDeletingStop(null);
    }
  }

  async function handleAddStop(data) {
    try {
      await addStop(data);
    } catch (err) {
      showToast('Failed to add stop. Check address and try again.');
      throw err; // Let StopForm reset properly
    }
  }

  async function handleEditStop(stopId, data) {
    try {
      await editStop(stopId, data);
    } catch (err) {
      showToast('Failed to update stop.');
      throw err;
    }
  }

  async function handleReorderStops(orderedIds) {
    try {
      await reorderStops(orderedIds);
    } catch (err) {
      showToast('Failed to reorder stops.');
    }
  }

  // Build stops array for MapPreview (use first stop coords for single-pin fallback)
  const firstStopWithCoords = stops.find((s) => s.address_lat && s.address_lon);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppNavBar />

      {/* Back navigation */}
      <div className="bg-white border-b border-slate-200 px-4 py-2">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
        >
          &larr; Back to trips
        </button>
      </div>

      {/* Cover photo hero (D-05) */}
      {trip && (
        <div className="relative h-48 md:h-64 overflow-hidden">
          {trip.cover_photo_url ? (
            <img
              src={trip.cover_photo_url}
              alt={trip.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-700" />
          )}
          {/* Trip name + description overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col justify-end p-6">
            <h1 className="text-3xl font-bold text-white">{trip.name}</h1>
            {trip.description && (
              <p className="text-sm text-white opacity-80 mt-1">{trip.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Split panel body (D-04) */}
      <div className="flex flex-col md:flex-row flex-1">
        {/* Left: Stop list (40% on tablet+) */}
        <div className="w-full md:w-2/5 border-b md:border-b-0 md:border-r border-slate-200 py-6 overflow-y-auto">
          {isLoading ? (
            <StopSkeleton />
          ) : (
            <StopList
              stops={stops}
              onAddStop={handleAddStop}
              onEditStop={handleEditStop}
              onDeleteStop={(stop) => setDeletingStop(stop)}
              onReorderStops={handleReorderStops}
            />
          )}
        </div>

        {/* Right: Map preview (60% on tablet+) — D-06: pins only, no routes yet */}
        <div className="w-full md:w-3/5 h-72 md:h-auto">
          {firstStopWithCoords ? (
            <div className="h-full">
              <MapPreview
                lat={firstStopWithCoords.address_lat}
                lon={firstStopWithCoords.address_lon}
              />
            </div>
          ) : (
            <div className="h-full bg-slate-100 flex items-center justify-center">
              <p className="text-sm text-slate-500">Add stops to see them on the map</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete stop confirm dialog (D-13) */}
      {deletingStop && (
        <ConfirmDialog
          title="Delete this stop?"
          message="This action cannot be undone. Are you sure?"
          confirmText="Delete"
          onConfirm={handleDeleteStop}
          onCancel={() => setDeletingStop(null)}
        />
      )}

      {/* Toast (UI-03) */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-semibold max-w-sm ${
          toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
