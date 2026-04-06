import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'sonner';
import api from '../services/api';
import { useTrip } from '../hooks/useTrip';
import { useRoute } from '../hooks/useRoute';
import AppNavBar from '../components/AppNavBar';
import StopList from '../components/StopList';
import TripMap from '../components/TripMap';
import RouteSummary from '../components/RouteSummary';
import ConfirmDialog from '../components/ConfirmDialog';
import TripCoverPhoto from '../components/TripCoverPhoto';
import POIPanel from '../components/POIPanel';

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
  const { trip, stops, isLoading, error, photoUrls, photoMetadata, addStop, editStop, removeStop, reorderStops } = useTrip(tripId);
  const { route, isLoading: routeLoading, error: routeError } = useRoute(tripId, stops);
  const [deletingStop, setDeletingStop] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  const [isSharing, setIsSharing] = useState(false);

  async function handleShare() {
    setIsSharing(true);
    try {
      const res = await api.post(`/api/trips/${tripId}/share`);
      await navigator.clipboard.writeText(res.data.shareUrl);
      toast.success('Share link copied to clipboard! Link expires in 7 days.');
    } catch (err) {
      // Error already handled by api.js interceptor (toast shown)
    } finally {
      setIsSharing(false);
    }
  }

  async function handleDeleteStop() {
    if (!deletingStop) return;
    try {
      await removeStop(deletingStop.id);
      setDeletingStop(null);
    } catch (err) {
      toast.error('Failed to delete stop. Please try again.');
      setDeletingStop(null);
    }
  }

  async function handleAddStop(data) {
    try {
      await addStop(data);
    } catch (err) {
      toast.error('Failed to add stop. Check address and try again.');
      throw err; // Let StopForm reset properly
    }
  }

  async function handleEditStop(stopId, data) {
    try {
      await editStop(stopId, data);
    } catch (err) {
      toast.error('Failed to update stop.');
      throw err;
    }
  }

  async function handleReorderStops(orderedIds) {
    try {
      await reorderStops(orderedIds);
    } catch (err) {
      toast.error('Failed to reorder stops.');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppNavBar />

      {/* Back navigation */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
        >
          &larr; Back to trips
        </button>
        <button
          onClick={handleShare}
          disabled={isSharing || !trip}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors disabled:opacity-50 min-h-[44px] px-2"
          aria-label="Share trip"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {isSharing ? 'Sharing...' : 'Share'}
        </button>
      </div>

      {/* Cover photo hero (D-05) with photo cycling (D-15) */}
      {trip && (
        <TripCoverPhoto
          trip={trip}
          photoUrls={photoUrls}
          photoMetadata={photoMetadata}
        />
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

        {/* Right: Interactive trip map (60% on tablet+) */}
        <div className="w-full md:w-3/5 flex flex-col">
          <div className="flex-1 min-h-[300px] md:min-h-0">
            <TripMap
              stops={stops}
              routeGeometry={route?.geometry}
              onStopClick={(stop) => setSelectedStop(stop)}
            />
          </div>
          <RouteSummary route={route} stops={stops} />
          {routeError && (
            <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-amber-700 text-sm">
              Route unavailable: {routeError}
            </div>
          )}
        </div>
      </div>

      {/* POI discovery panel — appears when a stop marker is clicked */}
      {selectedStop && (
        <POIPanel
          stop={selectedStop}
          onClose={() => setSelectedStop(null)}
        />
      )}

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

      {/* Toasts now rendered globally via sonner Toaster in App.jsx */}
    </div>
  );
}
