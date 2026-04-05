import { useEffect, useCallback } from 'react';
import { useTripStore } from '../store/tripStore';
import * as tripsApi from '../services/trips.api';

export function useTrips() {
  const {
    trips, isLoading, error,
    setTrips, setLoading, setError,
    updateTripInList, removeTripFromList,
  } = useTripStore();

  // Fetch trips list on mount
  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tripsApi.getTrips();
      setTrips(data.trips);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, [setTrips, setLoading, setError]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const createTrip = useCallback(async ({ name, description }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await tripsApi.createTrip({ name, description });
      setTrips([data.trip, ...trips]); // Prepend new trip
      return data; // Includes { trip, photoUrls, photoMetadata }
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to create trip';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [trips, setTrips, setLoading, setError]);

  const updateTrip = useCallback(async (tripId, updates) => {
    try {
      const data = await tripsApi.updateTrip(tripId, updates);
      updateTripInList(data.trip);
      return data.trip;
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to update trip';
      setError(message);
      throw new Error(message);
    }
  }, [updateTripInList, setError]);

  const deleteTrip = useCallback(async (tripId) => {
    try {
      await tripsApi.deleteTrip(tripId);
      removeTripFromList(tripId);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to delete trip';
      setError(message);
      throw new Error(message);
    }
  }, [removeTripFromList, setError]);

  return {
    trips,
    isLoading,
    error,
    createTrip,
    updateTrip,
    deleteTrip,
    refetch: fetchTrips,
  };
}
