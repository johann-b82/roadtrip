import { useState } from 'react';
import { useForm } from 'react-hook-form';
import AddressInput from './AddressInput';

export default function StopForm({ stop, onSubmit, onCancel }) {
  const isEditing = !!stop;
  const [selectedAddress, setSelectedAddress] = useState(
    stop ? { address: stop.address, lat: stop.address_lat, lon: stop.address_lon } : null
  );

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      description: stop?.description || '',
      startDate: stop?.start_date || '',
      endDate: stop?.end_date || '',
    }
  });

  function handleAddressSelect({ address, lat, lon }) {
    setSelectedAddress({ address, lat, lon });
  }

  async function onFormSubmit(data) {
    if (!selectedAddress?.address) return; // AddressInput has its own validation
    await onSubmit({
      address: selectedAddress.address,
      addressLat: selectedAddress.lat,
      addressLon: selectedAddress.lon,
      description: data.description || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
    });
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">
        {isEditing ? 'Edit stop' : 'Add a stop'}
      </h3>

      <form onSubmit={handleSubmit(onFormSubmit)} noValidate>
        {/* Address field (D-09, D-10) */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-800 mb-2">Address</label>
          <AddressInput
            onSelect={handleAddressSelect}
            placeholder={stop?.address || 'Search for a city, town, or address...'}
          />
          {!selectedAddress && !stop && (
            <p className="text-xs text-slate-500 mt-1">Start typing to search addresses</p>
          )}
        </div>

        {/* Description (optional) */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-800 mb-2">Description</label>
          <textarea
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Notes about this stop (optional)"
            rows={2}
            {...register('description')}
          />
        </div>

        {/* Dates row (D-12: native date inputs) */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">Start date</label>
            <input
              type="date"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('startDate')}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">End date</label>
            <input
              type="date"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('endDate')}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (!selectedAddress && !stop)}
            className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Save' : 'Add stop'}
          </button>
        </div>
      </form>
    </div>
  );
}
