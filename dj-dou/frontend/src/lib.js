import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import axios from 'axios';

// ── API client ─────────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000' });
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('djdou_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) { localStorage.removeItem('djdou_token'); window.location.href = '/login'; }
    return Promise.reject(err);
  }
);
export default api;
export const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ── Contexts ───────────────────────────────────────────────────────────────────
export const AuthCtx   = createContext(null);
export const PlayerCtx = createContext(null);
export const useAuth   = () => useContext(AuthCtx);
export const usePlayer = () => useContext(PlayerCtx);

// ── useAuthState ───────────────────────────────────────────────────────────────
export function useAuthState() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!localStorage.getItem('djdou_token')) { setLoading(false); return; }
    try { const { data } = await api.get('/auth/me'); setUser(data); }
    catch { localStorage.removeItem('djdou_token'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  return {
    user, loading, refetch: fetchUser,
    login:  () => { window.location.href = `${BASE}/auth/spotify`; },
    logout: () => { localStorage.removeItem('djdou_token'); setUser(null); },
  };
}

// ── useDNA ─────────────────────────────────────────────────────────────────────
export function useDNA() {
  const [dna, setDna]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [computing, setComputing] = useState(false);
  const [error, setError]       = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/dna/profile'); setDna(data); }
    catch (e) { if (e.response?.status !== 404) setError(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  }, []);

  const compute = useCallback(async () => {
    setComputing(true); setError(null);
    try { const { data } = await api.post('/dna/compute'); setDna(data); return data; }
    catch (e) { setError(e.response?.data?.error || 'Failed'); throw e; }
    finally { setComputing(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { dna, loading, computing, error, compute, refetch: fetch };
}

// ── useRecs ────────────────────────────────────────────────────────────────────
export function useRecs() {
  const [recs, setRecs]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async (refresh = false) => {
    setLoading(true); setError(null);
    try { const { data } = await api.get('/recommendations', { params: { refresh } }); setRecs(data); }
    catch (e) { setError(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  }, []);

  return { recs, loading, error, fetch };
}

// ── usePlayerState ─────────────────────────────────────────────────────────────
export function usePlayerState() {
  const [track, setTrack]     = useState(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const rafRef   = useRef(null);

  useEffect(() => {
    const a = new Audio();
    a.addEventListener('ended', () => { setPlaying(false); setProgress(0); });
    audioRef.current = a;
    return () => { cancelAnimationFrame(rafRef.current); a.pause(); a.src = ''; };
  }, []);

  const tick = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    setProgress(a.duration ? a.currentTime / a.duration : 0);
    if (!a.paused) rafRef.current = requestAnimationFrame(tick);
  }, []);

  const play = useCallback((t) => {
    const a = audioRef.current;
    if (!t.previewUrl) return;
    if (track?.spotifyId === t.spotifyId) {
      if (a.paused) { a.play(); setPlaying(true); rafRef.current = requestAnimationFrame(tick); }
      else { a.pause(); setPlaying(false); cancelAnimationFrame(rafRef.current); }
      return;
    }
    cancelAnimationFrame(rafRef.current);
    a.pause(); a.src = t.previewUrl; a.currentTime = 0;
    setTrack(t); setProgress(0);
    a.play().then(() => { setPlaying(true); rafRef.current = requestAnimationFrame(tick); }).catch(() => {});
  }, [track, tick]);

  const pause  = useCallback(() => { audioRef.current?.pause(); setPlaying(false); cancelAnimationFrame(rafRef.current); }, []);
  const seek   = useCallback((r) => { const a = audioRef.current; if (!a?.duration) return; a.currentTime = r * a.duration; setProgress(r); }, []);

  return { track, playing, progress, play, pause, seek };
}

// ── useSearch ──────────────────────────────────────────────────────────────────
export function useSearch() {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  const search = useCallback((q) => {
    setQuery(q);
    clearTimeout(timer.current);
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try { const { data } = await api.get('/tracks/search', { params: { q, limit: 8 } }); setResults(data); }
      catch { setResults([]); }
      finally { setLoading(false); }
    }, 350);
  }, []);

  const clear = useCallback(() => { clearTimeout(timer.current); setQuery(''); setResults([]); setLoading(false); }, []);
  return { query, results, loading, search, clear };
}

// ── DNA feature metadata ───────────────────────────────────────────────────────
export const FEATURES = [
  { key:'danceability',     label:'Danceability',  icon:'💃', color:'#a855f7' },
  { key:'energy',           label:'Energy',        icon:'⚡', color:'#f472b6' },
  { key:'key',              label:'Key',           icon:'🎹', color:'#22d3ee' },
  { key:'loudness',         label:'Loudness',      icon:'🔊', color:'#fb923c' },
  { key:'mode',             label:'Mode',          icon:'🎼', color:'#34d399' },
  { key:'speechiness',      label:'Speechiness',   icon:'🎤', color:'#f59e0b' },
  { key:'acousticness',     label:'Acoustic',      icon:'🪕', color:'#60a5fa' },
  { key:'instrumentalness', label:'Instrumental',  icon:'🎸', color:'#c084fc' },
  { key:'liveness',         label:'Liveness',      icon:'🎭', color:'#f87171' },
  { key:'valence',          label:'Positivity',    icon:'☀️', color:'#fbbf24' },
  { key:'tempo',            label:'Tempo',         icon:'🥁', color:'#a3e635' },
  { key:'duration',         label:'Duration',      icon:'⏱',  color:'#94a3b8' },
  { key:'time_signature',   label:'Time Sig',      icon:'🎵', color:'#e879f9' },
];

export function matchColor(s) {
  if (s >= 0.85) return '#a3e635';
  if (s >= 0.7)  return '#a855f7';
  if (s >= 0.5)  return '#22d3ee';
  return '#9d8fc4';
}
