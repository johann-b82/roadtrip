import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import api from '../services/api';
import TripMap from '../components/TripMap';
import TripCoverPhoto from '../components/TripCoverPhoto';

function StopReadOnly({ stop, index }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 flex gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{stop.address}</p>
        {stop.description && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{stop.description}</p>
        )}
        {(stop.start_date || stop.end_date) && (
          <p className="text-xs text-slate-400 mt-1">
            {stop.start_date && new Date(stop.start_date).toLocaleDateString()}
            {stop.start_date && stop.end_date && ' – '}
            {stop.end_date && new Date(stop.end_date).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

export default function SharedTrip() {
  const { token } = useParams();
  const [trip, setTrip] = useState(null);
  const [stops, setStops] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'loaded' | 'expired' | 'error'

  useEffect(() => {
    api.get(`/api/trips/shared/${token}`)
      .then((res) => {
        setTrip(res.data.trip);
        setStops(res.data.stops || []);
        setStatus('loaded');
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setStatus('expired');
        } else {
          setStatus('error');
        }
      });
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading trip...</p>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-50 px-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4" aria-hidden="true">🗺️</div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Link expired or invalid</h1>
          <p className="text-slate-600 text-sm mb-6">
            This trip share link has expired or is no longer valid.
          </p>
          <Link
            to="/login"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm inline-block"
          >
            Log in to view your trips
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Failed to load trip.</p>
          <button onClick={() => window.location.reload()} className="text-blue-600 text-sm underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-slate-800 truncate">{trip.name}</h1>
          {trip.description && (
            <p className="text-xs text-slate-500 truncate">{trip.description}</p>
          )}
        </div>
        <Link
          to="/signup"
          className="ml-4 flex-shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors min-h-[44px] flex items-center"
        >
          Plan your trip
        </Link>
      </header>

      {/* Cover photo */}
      {trip.cover_photo_url && (
        <TripCoverPhoto trip={trip} photoUrls={[trip.cover_photo_url]} photoMetadata={[]} />
      )}

      {/* Split panel: stop list + map */}
      <div className="flex flex-col md:flex-row flex-1">
        {/* Stop list — read-only */}
        <div className="w-full md:w-2/5 border-b md:border-b-0 md:border-r border-slate-200 py-4 overflow-y-auto">
          <div className="px-4 mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {stops.length} {stops.length === 1 ? 'Stop' : 'Stops'}
            </p>
          </div>
          {stops.length === 0 ? (
            <p className="text-sm text-slate-500 px-4">No stops on this trip.</p>
          ) : (
            <div className="space-y-2 px-4">
              {stops.map((stop, i) => (
                <StopReadOnly key={stop.id} stop={stop} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Map — markers only, no route (route endpoint requires auth) */}
        <div className="w-full md:w-3/5 min-h-[300px] md:min-h-0">
          <TripMap
            stops={stops}
            routeGeometry={null}
            onStopClick={undefined}
          />
        </div>
      </div>
    </div>
  );
}
