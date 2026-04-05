import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTrips } from '../hooks/useTrips';
import AppNavBar from '../components/AppNavBar';
import TripCard from '../components/TripCard';
import CreateTripModal from '../components/CreateTripModal';
import ConfirmDialog from '../components/ConfirmDialog';

// Skeleton card for loading state (3 shown per UI-SPEC)
function TripCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-100 overflow-hidden animate-pulse">
      <div className="h-40 bg-slate-200" />
      <div className="p-4 space-y-2">
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { trips, isLoading, error, createTrip, updateTrip, deleteTrip } = useTrips();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [deletingTrip, setDeletingTrip] = useState(null);
  const [toast, setToast] = useState(null); // { message, type }

  function showToast(message, type = 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }

  async function handleCreateTrip(data) {
    setIsSubmitting(true);
    try {
      const result = await createTrip(data);
      setIsCreateModalOpen(false);
      navigate(`/trips/${result.trip.id}`);
    } catch (err) {
      showToast(`Failed to create trip. ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteTrip() {
    if (!deletingTrip) return;
    try {
      await deleteTrip(deletingTrip.id);
      setDeletingTrip(null);
    } catch (err) {
      showToast(`Failed to delete trip. Please try again.`);
      setDeletingTrip(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNavBar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Your Trips</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Trip
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-4 mb-4">
            {error}
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <TripCardSkeleton />
            <TripCardSkeleton />
            <TripCardSkeleton />
          </div>
        )}

        {/* Empty state (D-02) */}
        {!isLoading && trips.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">&#x1f5fa;&#xfe0f;</div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Plan your first road trip</h2>
            <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto">
              Create a trip to start planning your adventure. Set stops, dates, and explore the route.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              + New Trip
            </button>
          </div>
        )}

        {/* Trip card grid (D-01) */}
        {!isLoading && trips.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onEdit={(t) => setEditingTrip(t)}
                onDelete={(t) => setDeletingTrip(t)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create trip modal (D-03) */}
      <CreateTripModal
        isOpen={isCreateModalOpen}
        onSubmit={handleCreateTrip}
        onClose={() => setIsCreateModalOpen(false)}
        isSubmitting={isSubmitting}
      />

      {/* Delete trip confirm dialog (D-08) */}
      {deletingTrip && (
        <ConfirmDialog
          title="Delete this trip?"
          message={`This action cannot be undone. All ${deletingTrip.stop_count || 0} stops will be deleted.`}
          confirmText="Delete"
          onConfirm={handleDeleteTrip}
          onCancel={() => setDeletingTrip(null)}
        />
      )}

      {/* Toast notifications (UI-03) -- bottom-right, fixed */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-semibold max-w-sm ${
          toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          'bg-yellow-50 text-yellow-700 border border-yellow-200'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
