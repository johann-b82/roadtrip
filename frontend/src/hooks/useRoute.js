import { useState, useEffect, useCallback } from 'react';
import { getRoute } from '../services/routing.api';

/**
 * Fetches OSRM route data for a trip. Skips fetch when fewer than 2 stops
 * have valid coordinates. Refetches when stops are added, removed, reordered,
 * or have their address changed.
 *
 * @param {string|number} tripId
 * @param {Array<{ id: string|number, address_lat: number|null, address_lon: number|null }>} stops
 * @returns {{ route: object|null, isLoading: boolean, error: string|null, refetchRoute: Function }}
 */
export function useRoute(tripId, stops) {
  const [route, setRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const stopsKey = stops.map((s) => `${s.id}:${s.address_lat}:${s.address_lon}`).join(',');
  const coordCount = stops.filter((s) => s.address_lat && s.address_lon).length;

  const fetchRoute = useCallback(async () => {
    if (!tripId) return;
    if (coordCount < 2) {
      setRoute(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await getRoute(tripId);
      setRoute(data.route);
    } catch (err) {
      setError(err.response?.data?.error || 'Route unavailable');
      setRoute(null);
    } finally {
      setIsLoading(false);
    }
  }, [tripId, coordCount, stopsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  return { route, isLoading, error, refetchRoute: fetchRoute };
}
