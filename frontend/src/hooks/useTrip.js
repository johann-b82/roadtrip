import { useEffect, useCallback } from 'react';
import { useTripStore } from '../store/tripStore';
import * as tripsApi from '../services/trips.api';
import * as stopsApi from '../services/stops.api';

export function useTrip(tripId) {
  const {
    selectedTrip, stops, isLoading, error, photoUrls, photoMetadata,
    setSelectedTrip, setStops, setLoading, setError, setPhotoUrls,
    updateTripInList, updateStopInList, removeStopFromList, clearTrip,
  } = useTripStore();

  const fetchTrip = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await tripsApi.getTrip(tripId);
      setSelectedTrip(data.trip);
      setStops(data.stops);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load trip');
    } finally {
      setLoading(false);
    }
  }, [tripId, setSelectedTrip, setStops, setLoading, setError]);

  useEffect(() => {
    fetchTrip();
    return () => clearTrip(); // Cleanup on unmount
  }, [fetchTrip, clearTrip]);

  const addStop = useCallback(async (stopData) => {
    try {
      const data = await stopsApi.createStop(tripId, stopData);
      setStops([...stops, data.stop]);
      return data.stop;
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to add stop. Check address and try again.';
      setError(message);
      throw new Error(message);
    }
  }, [tripId, stops, setStops, setError]);

  const editStop = useCallback(async (stopId, updates) => {
    try {
      const data = await stopsApi.updateStop(stopId, updates);
      updateStopInList(data.stop);
      return data.stop;
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to update stop';
      setError(message);
      throw new Error(message);
    }
  }, [updateStopInList, setError]);

  const removeStop = useCallback(async (stopId) => {
    try {
      await stopsApi.deleteStop(stopId);
      removeStopFromList(stopId);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to delete stop. Please try again.';
      setError(message);
      throw new Error(message);
    }
  }, [removeStopFromList, setError]);

  const reorderStops = useCallback(async (orderedIds) => {
    // Optimistic update: reorder in store immediately
    const reordered = orderedIds.map((id) => stops.find((s) => s.id === id)).filter(Boolean);
    setStops(reordered);
    try {
      const data = await stopsApi.reorderStops(tripId, orderedIds);
      setStops(data.stops); // Sync with server order
    } catch (err) {
      setStops(stops); // Revert on failure
      const message = err.response?.data?.error || 'Failed to reorder stops';
      setError(message);
      throw new Error(message);
    }
  }, [tripId, stops, setStops, setError]);

  return {
    trip: selectedTrip,
    stops,
    isLoading,
    error,
    photoUrls,
    photoMetadata,
    addStop,
    editStop,
    removeStop,
    reorderStops,
    refetch: fetchTrip,
  };
}
