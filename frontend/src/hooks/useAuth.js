import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('djdou_token');
    if (!token) { setLoading(false); return; }

    try {
      const { data } = await authAPI.getMe();
      setUser(data);
    } catch {
      localStorage.removeItem('djdou_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const login = () => {
    window.location.href = authAPI.loginUrl();
  };

  const logout = useCallback(() => {
    localStorage.removeItem('djdou_token');
    setUser(null);
  }, []);

  return { user, loading, error, login, logout, refetch: fetchUser };
}
