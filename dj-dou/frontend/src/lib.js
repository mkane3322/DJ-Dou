import {
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  useContext,
} from "react";
import axios from "axios";
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
});
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("djdou_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("djdou_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);
export const API_BASE =
  process.env.REACT_APP_API_URL || "http://localhost:5000";
export default api;
export const AuthContext = createContext(null);
export const PlayerContext = createContext(null);
export const useAuthCtx = () => useContext(AuthContext);
export const usePlayerCtx = () => useContext(PlayerContext);
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchUser = useCallback(async () => {
    if (!localStorage.getItem("djdou_token")) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      localStorage.removeItem("djdou_token");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);
  return {
    user,
    loading,
    login: () => {
      window.location.href = `${API_BASE}/auth/spotify`;
    },
    logout: () => {
      localStorage.removeItem("djdou_token");
      setUser(null);
    },
    refetch: fetchUser,
  };
}
export function useDNA() {
  const [dna, setDna] = useState(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState(null);
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/dna/profile");
      setDna(data);
    } catch (err) {
      if (err.response?.status !== 404)
        setError(err.response?.data?.error || "Failed");
    } finally {
      setLoading(false);
    }
  }, []);
  const computeDNA = useCallback(async () => {
    setComputing(true);
    setError(null);
    try {
      const { data } = await api.post("/dna/compute");
      setDna(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.error || "Failed to compute DNA");
      throw err;
    } finally {
      setComputing(false);
    }
  }, []);
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  return { dna, loading, computing, error, computeDNA, refetch: fetchProfile };
}
export function useRecommendations() {
  const [recommendations, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [moodResults, setMoodResults] = useState(null);
  const [moodLoading, setMoodLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchRecommendations = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/recommendations", {
        params: { refresh },
      });
      setRecs(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed");
    } finally {
      setLoading(false);
    }
  }, []);
  const searchByMood = useCallback(async (query) => {
    setMoodLoading(true);
    setMoodResults(null);
    try {
      const { data } = await api.post("/recommendations/mood", { query });
      setMoodResults(data);
    } catch (err) {
      setError(err.response?.data?.error || "Mood search failed");
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
export function useSeeds() {
  const [seeds, setSeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const fetchSeeds = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/seeds");
      setSeeds(data);
    } finally {
      setLoading(false);
    }
  }, []);
  const addSeed = useCallback(async (spotifyId) => {
    setAdding(true);
    try {
      const { data } = await api.post("/seeds", { spotifyId });
      setSeeds((p) => [data, ...p]);
    } finally {
      setAdding(false);
    }
  }, []);
  const removeSeed = useCallback(async (trackId) => {
    await api.delete(`/seeds/${trackId}`);
    setSeeds((p) => p.filter((s) => (s.track?._id || s.track?.id) !== trackId));
  }, []);
  useEffect(() => {
    fetchSeeds();
  }, [fetchSeeds]);
  return {
    seeds,
    seedSpotifyIds: seeds.map((s) => s.track?.spotifyId).filter(Boolean),
    loading,
    adding,
    addSeed,
    removeSeed,
  };
}
export function usePlayer() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const rafRef = useRef(null);
  useEffect(() => {
    const audio = new Audio();
    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setProgress(0);
    });
    audioRef.current = audio;
    return () => {
      cancelAnimationFrame(rafRef.current);
      audio.pause();
      audio.src = "";
    };
  }, []);
  const tick = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    setProgress(a.duration ? a.currentTime / a.duration : 0);
    if (!a.paused) rafRef.current = requestAnimationFrame(tick);
  }, []);
  const play = useCallback(
    (track) => {
      const a = audioRef.current;
      if (!track.previewUrl) return;
      if (currentTrack?.spotifyId === track.spotifyId) {
        if (a.paused) {
          a.play();
          setIsPlaying(true);
          rafRef.current = requestAnimationFrame(tick);
        } else {
          a.pause();
          setIsPlaying(false);
          cancelAnimationFrame(rafRef.current);
        }
        return;
      }
      cancelAnimationFrame(rafRef.current);
      a.pause();
      a.src = track.previewUrl;
      a.currentTime = 0;
      setCurrentTrack(track);
      setProgress(0);
      a.play()
        .then(() => {
          setIsPlaying(true);
          rafRef.current = requestAnimationFrame(tick);
        })
        .catch(() => {});
    },
    [currentTrack, tick],
  );
  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    cancelAnimationFrame(rafRef.current);
  }, []);
  const seek = useCallback((ratio) => {
    const a = audioRef.current;
    if (!a?.duration) return;
    a.currentTime = ratio * a.duration;
    setProgress(ratio);
  }, []);
  return { currentTrack, isPlaying, progress, play, pause, seek };
}
export function useTrackSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);
  const search = useCallback((q) => {
    setQuery(q);
    clearTimeout(timer.current);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const { data } = await api.get("/tracks/search", {
          params: { q, limit: 8 },
        });
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, []);
  const clear = useCallback(() => {
    clearTimeout(timer.current);
    setQuery("");
    setResults([]);
    setLoading(false);
  }, []);
  return { query, results, loading, search, clear };
}
export const FEATURE_META = [
  { key: "danceability", label: "Danceability", icon: "💃", color: "#a855f7" },
  { key: "energy", label: "Energy", icon: "⚡", color: "#f472b6" },
  { key: "key", label: "Key", icon: "🎹", color: "#22d3ee" },
  { key: "loudness", label: "Loudness", icon: "🔊", color: "#fb923c" },
  { key: "mode", label: "Mode", icon: "🎼", color: "#34d399" },
  { key: "speechiness", label: "Speechiness", icon: "🎤", color: "#f59e0b" },
  { key: "acousticness", label: "Acoustic", icon: "🪕", color: "#60a5fa" },
  {
    key: "instrumentalness",
    label: "Instrumental",
    icon: "🎸",
    color: "#c084fc",
  },
  { key: "liveness", label: "Liveness", icon: "🎭", color: "#f87171" },
  { key: "valence", label: "Positivity", icon: "☀️", color: "#fbbf24" },
  { key: "tempo", label: "Tempo", icon: "🥁", color: "#a3e635" },
  { key: "duration", label: "Duration", icon: "⏱", color: "#94a3b8" },
  { key: "time_signature", label: "Time Sig", icon: "🎵", color: "#e879f9" },
];
export function matchColor(score) {
  if (score >= 0.85) return "#a3e635";
  if (score >= 0.7) return "#a855f7";
  if (score >= 0.5) return "#22d3ee";
  return "#9d8fc4";
}
