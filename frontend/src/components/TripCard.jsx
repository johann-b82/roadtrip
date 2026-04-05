import { useNavigate } from 'react-router';

export default function TripCard({ trip, onEdit, onDelete }) {
  const navigate = useNavigate();

  function formatDateRange(first, last) {
    if (!first && !last) return null;
    if (first && last) return `${first} to ${last}`;
    return first || last;
  }

  const dateRange = formatDateRange(trip.first_stop_date, trip.last_stop_date);
  const stopCount = trip.stop_count || 0;
  const metaText = dateRange
    ? `${stopCount} stop${stopCount !== 1 ? 's' : ''} \u00b7 ${dateRange}`
    : `${stopCount} stop${stopCount !== 1 ? 's' : ''}`;

  return (
    <div
      className="bg-white rounded-lg shadow-lg border border-slate-100 overflow-hidden cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-200"
      onClick={() => navigate(`/trips/${trip.id}`)}
    >
      {/* Cover photo or gradient fallback (D-16) */}
      <div className="relative h-40 overflow-hidden">
        {trip.cover_photo_url ? (
          <img
            src={trip.cover_photo_url}
            alt={trip.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-700 flex items-end p-4">
            <span className="text-white text-sm font-semibold opacity-80">{trip.name}</span>
          </div>
        )}

        {/* Edit/Delete actions (stop propagation to avoid card nav) */}
        <div
          className="absolute top-2 right-2 flex gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onEdit(trip)}
            className="bg-white bg-opacity-90 text-slate-700 text-xs font-semibold px-2 py-1 rounded hover:bg-white transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(trip)}
            className="bg-white bg-opacity-90 text-red-600 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <h2 className="text-xl font-semibold text-slate-800 truncate">{trip.name}</h2>
        <p className="text-xs text-slate-500 mt-1">{metaText}</p>
        {trip.description && (
          <p className="text-sm text-slate-600 mt-2 line-clamp-2">{trip.description}</p>
        )}
      </div>
    </div>
  );
}
