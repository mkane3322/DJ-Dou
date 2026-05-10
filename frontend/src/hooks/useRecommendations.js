import { useState, useCallback } from 'react';
import { recommendationsAPI } from '../utils/api';

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [moodResults, setMoodResults] = useState(null);
  const [moodLoading, setMoodLoading] = useState(false);

  const fetchRecommendations = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await recommendationsAPI.get({ refresh });
      setRecommendations(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByMood = useCallback(async (query) => {
    setMoodLoading(true);
    setMoodResults(null);
    try {
      const { data } = await recommendationsAPI.getMood(query);
      setMoodResults(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.error || 'Mood search failed');
    } finally {
      setMoodLoading(false);
    }
  }, []);

  return {
    recommendations,
    loading,
    error,
    fetchRecommendations,
    moodResults,
    moodLoading,
    searchByMood,
  };
}
