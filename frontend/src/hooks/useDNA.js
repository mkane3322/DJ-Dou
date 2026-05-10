import { useState, useEffect, useCallback } from 'react';
import { dnaAPI } from '../utils/api';

export function useDNA() {
  const [dna, setDna] = useState(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await dnaAPI.getProfile();
      setDna(data);
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.error || 'Failed to load DNA profile');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const computeDNA = useCallback(async () => {
    setComputing(true);
    setError(null);
    try {
      const { data } = await dnaAPI.compute();
      setDna(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to compute DNA');
      throw err;
    } finally {
      setComputing(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  return { dna, loading, computing, error, computeDNA, refetch: fetchProfile };
}
