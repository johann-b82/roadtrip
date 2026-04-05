import { useState, useEffect, useCallback } from 'react';
import { getPOIs, searchPOIs, getCategories } from '../services/pois.api';

export function usePOIs(stopId) {
  const [pois, setPois] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(null);

  // Fetch categories on mount (fire-and-forget)
  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data.categories || []))
      .catch(() => {
        // Categories are non-critical; silently ignore errors
      });
  }, []);

  // Fetch POIs when stopId changes
  useEffect(() => {
    if (!stopId) {
      setPois([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setSearchQuery(null);

    getPOIs(stopId)
      .then((data) => {
        if (!cancelled) {
          setPois(data.pois || []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.error || 'Failed to load POIs');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [stopId]);

  const search = useCallback(
    async (query) => {
      if (!stopId) return;

      if (!query) {
        // Reset to default POIs
        setIsLoading(true);
        setError(null);
        setSearchQuery(null);
        try {
          const data = await getPOIs(stopId);
          setPois(data.pois || []);
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to load POIs');
        } finally {
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await searchPOIs(stopId, query);
        setPois(data.pois || []);
        setSearchQuery(query);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to search POIs');
      } finally {
        setIsLoading(false);
      }
    },
    [stopId]
  );

  return { pois, categories, isLoading, error, searchQuery, search };
}
