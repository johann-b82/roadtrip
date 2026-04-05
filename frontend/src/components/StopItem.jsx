import StopForm from './StopForm';

export default function StopItem({ stop, index, isEditing, onEdit, onDelete, onSave, onCancelEdit }) {
  if (isEditing) {
    return (
      <StopForm
        stop={stop}
        onSubmit={onSave}
        onCancel={onCancelEdit}
      />
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        {/* Stop number badge */}
        <span className="flex-shrink-0 bg-blue-600 text-white text-xs font-semibold rounded-full w-7 h-7 flex items-center justify-center">
          {index + 1}
        </span>

        {/* Stop content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{stop.address}</p>
          {stop.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{stop.description}</p>
          )}
          {(stop.start_date || stop.end_date) && (
            <p className="text-xs text-slate-400 mt-1">
              {stop.start_date && stop.end_date
                ? `${stop.start_date} – ${stop.end_date}`
                : stop.start_date || stop.end_date}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(stop)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(stop)}
            className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
