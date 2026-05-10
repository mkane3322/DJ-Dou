import { useState, useCallback, useRef } from 'react';
import { tracksAPI } from '../utils/api';

/**
 * Debounced Spotify track search hook.
 * @param {number} debounceMs - debounce delay in ms (default 350)
 */
export function useTrackSearch(debounceMs = 350) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const search = useCallback(
    (q) => {
      setQuery(q);
      clearTimeout(timerRef.current);

      if (!q.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      timerRef.current = setTimeout(async () => {
        try {
          const { data } = await tracksAPI.search(q, 10);
          setResults(data);
          setError(null);
        } catch (err) {
          setError(err.response?.data?.error || 'Search failed');
        } finally {
          setLoading(false);
        }
      }, debounceMs);
    },
    [debounceMs]
  );

  const clear = useCallback(() => {
    clearTimeout(timerRef.current);
    setQuery('');
    setResults([]);
    setLoading(false);
    setError(null);
  }, []);

  return { query, results, loading, error, search, clear };
}
