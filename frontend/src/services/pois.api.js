import api from './api';

export async function getPOIs(stopId) {
  const response = await api.get(`/api/stops/${stopId}/pois`);
  return response.data; // { pois: [...] }
}

export async function searchPOIs(stopId, query) {
  const response = await api.get(`/api/stops/${stopId}/pois/search?q=${encodeURIComponent(query)}`);
  return response.data; // { pois: [...], query }
}

export async function getCategories() {
  const response = await api.get('/api/pois/categories');
  return response.data; // { categories: [...] }
}
