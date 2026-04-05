import api from './api';

export async function getTrips() {
  const response = await api.get('/api/trips');
  return response.data; // { trips }
}

export async function getTrip(tripId) {
  const response = await api.get(`/api/trips/${tripId}`);
  return response.data; // { trip, stops }
}

export async function createTrip({ name, description }) {
  const response = await api.post('/api/trips', { name, description });
  return response.data; // { trip, photoUrls, photoMetadata }
}

export async function updateTrip(tripId, updates) {
  const response = await api.put(`/api/trips/${tripId}`, updates);
  return response.data; // { trip }
}

export async function deleteTrip(tripId) {
  const response = await api.delete(`/api/trips/${tripId}`);
  return response.data; // { deleted, tripId }
}
