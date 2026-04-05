import api from './api';

export async function getStops(tripId) {
  const response = await api.get(`/api/trips/${tripId}/stops`);
  return response.data; // { stops }
}

export async function createStop(tripId, stopData) {
  const response = await api.post(`/api/trips/${tripId}/stops`, stopData);
  return response.data; // { stop }
}

export async function updateStop(stopId, updates) {
  const response = await api.put(`/api/stops/${stopId}`, updates);
  return response.data; // { stop }
}

export async function deleteStop(stopId) {
  const response = await api.delete(`/api/stops/${stopId}`);
  return response.data; // { deleted, stopId }
}

export async function reorderStops(tripId, orderedIds) {
  const response = await api.put(`/api/trips/${tripId}/stops/reorder`, { orderedIds });
  return response.data; // { stops }
}
