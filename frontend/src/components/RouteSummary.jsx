import { useState } from 'react';

function formatDistance(meters) {
  if (meters < 1000) return `${meters.toFixed(0)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds) {
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes}min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}min`;
}

/**
 * Displays a compact route summary bar with total distance/duration
 * and a collapsible per-leg breakdown.
 *
 * Props:
 *   route — route object from useRoute: { distance, duration, legs }
 *   stops — full stops array for extracting stop name labels
 */
export default function RouteSummary({ route, stops }) {
  const [legsOpen, setLegsOpen] = useState(false);

  if (!route) return null;

  return (
    <div className="bg-white border-t border-slate-200 px-4 py-3 text-sm">
      {/* Total summary row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-800">
            {formatDistance(route.distance)}
          </span>
          <span className="text-slate-500">&middot;</span>
          <span className="text-slate-600">{formatDuration(route.duration)}</span>
        </div>
        {route.legs && route.legs.length > 0 && (
          <button
            onClick={() => setLegsOpen((prev) => !prev)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            {legsOpen ? 'Hide legs' : `${route.legs.length} leg${route.legs.length !== 1 ? 's' : ''}`}
          </button>
        )}
      </div>

      {/* Per-leg breakdown (collapsible) */}
      {legsOpen && route.legs && route.legs.length > 0 && (
        <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
          {route.legs.map((leg, index) => {
            const fromName = stops[index]?.address?.split(',')[0] || `Stop ${index + 1}`;
            const toName = stops[index + 1]?.address?.split(',')[0] || `Stop ${index + 2}`;
            return (
              <div key={index} className="flex items-center justify-between text-xs text-slate-600">
                <span className="truncate max-w-[60%]">
                  {fromName} &rarr; {toName}
                </span>
                <span className="flex-shrink-0 ml-2 text-slate-500">
                  {formatDistance(leg.distance)} &middot; {formatDuration(leg.duration)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
