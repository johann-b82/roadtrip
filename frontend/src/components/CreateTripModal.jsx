import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

export default function CreateTripModal({ isOpen, onSubmit, onClose, isSubmitting }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Close on Escape key (accessibility)
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  function handleClose() {
    reset();
    onClose();
  }

  async function onFormSubmit(data) {
    await onSubmit(data);
    reset();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Create a new trip</h2>

        <form onSubmit={handleSubmit(onFormSubmit)} noValidate>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Trip name
            </label>
            <input
              type="text"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'}`}
              placeholder="e.g. Summer Pacific Coast Drive"
              {...register('name', { required: 'Trip name is required', minLength: { value: 1, message: 'Name cannot be empty' } })}
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Description
            </label>
            <textarea
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Describe your trip to help find a great cover photo..."
              rows={3}
              {...register('description')}
            />
            <p className="text-xs text-slate-500 mt-1">Used to find a cover photo automatically</p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-semibold border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
