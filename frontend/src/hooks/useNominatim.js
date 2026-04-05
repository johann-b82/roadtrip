import { useState, useCallback, useRef } from 'react';
import api from '../services/api';

const NOMINATIM_CACHE = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function useNominatim() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef(null);

  const search = useCallback((query) => {
    if (!query || query.trim().length < 3) {
      setResults([]);
      return;
    }

    const cacheKey = query.trim().toLowerCase();
    const cached = NOMINATIM_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setResults(cached.results);
      return;
    }

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await api.get('/api/geocoding/search', {
          params: { q: query.trim() },
        });
        NOMINATIM_CACHE.set(cacheKey, { results: response.data, timestamp: Date.now() });
        setResults(response.data);
      } catch (err) {
        console.error('Address search error:', err.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce
  }, []);

  const clearResults = useCallback(() => setResults([]), []);

  return { results, loading, search, clearResults };
}
