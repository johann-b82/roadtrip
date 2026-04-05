import api from './api';

/**
 * Fetch the OSRM route for a trip from the backend.
 * @param {string|number} tripId
 * @returns {Promise<{ route: { geometry: string, distance: number, duration: number, legs: Array<{ distance: number, duration: number }> } }>}
 */
export async function getRoute(tripId) {
  const response = await api.get(`/trips/${tripId}/route`);
  return response.data;
}
