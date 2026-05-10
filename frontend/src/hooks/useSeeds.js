import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export function useSeeds() {
  const [seeds, setSeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  const fetchSeeds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/seeds');
      setSeeds(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load seed tracks');
    } finally {
      setLoading(false);
    }
  }, []);

  const addSeed = useCallback(async (spotifyId) => {
    setAdding(true);
    try {
      const { data } = await api.post('/seeds', { spotifyId });
      setSeeds((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to add seed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setAdding(false);
    }
  }, []);

  const removeSeed = useCallback(async (trackId) => {
    try {
      await api.delete(`/seeds/${trackId}`);
      setSeeds((prev) => prev.filter((s) => s.track?._id !== trackId && s.track?.id !== trackId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove seed');
    }
  }, []);

  useEffect(() => { fetchSeeds(); }, [fetchSeeds]);

  const seedSpotifyIds = seeds.map((s) => s.track?.spotifyId).filter(Boolean);

  return { seeds, seedSpotifyIds, loading, adding, error, addSeed, removeSeed, refetch: fetchSeeds };
}
