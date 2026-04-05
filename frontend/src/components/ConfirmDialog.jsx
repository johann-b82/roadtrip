import { useEffect } from 'react';

export default function ConfirmDialog({ title, message, confirmText = 'Confirm', onConfirm, onCancel, isDangerous = false }) {
  // Close on Escape key (accessibility)
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-2">{title}</h2>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            aria-label={isDangerous ? `${confirmText} (cannot be undone)` : confirmText}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
