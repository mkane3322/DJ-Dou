import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 15000,
});

// Inject JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('djdou_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('djdou_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  getMe: () => api.get('/auth/me'),
  loginUrl: () => `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/auth/spotify`,
};

// ─── DNA ──────────────────────────────────────────────────────────────────────
export const dnaAPI = {
  getProfile: () => api.get('/dna/profile'),
  compute: () => api.post('/dna/compute'),
  getChartData: () => api.get('/dna/chart-data'),
};

// ─── Recommendations ──────────────────────────────────────────────────────────
export const recommendationsAPI = {
  get: (params = {}) => api.get('/recommendations', { params }),
  getMood: (query) => api.post('/recommendations/mood', { query }),
};

// ─── Tracks ───────────────────────────────────────────────────────────────────
export const tracksAPI = {
  search: (q, limit = 20) => api.get('/tracks/search', { params: { q, limit } }),
  getOne: (spotifyId) => api.get(`/tracks/${spotifyId}`),
};

// ─── Interactions ─────────────────────────────────────────────────────────────
export const interactionsAPI = {
  log: (trackId, action) => api.post('/interactions', { trackId, action }),
  getHistory: (params = {}) => api.get('/interactions/history', { params }),
  remove: (trackId) => api.delete(`/interactions/${trackId}`),
};

// ─── User ─────────────────────────────────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post('/user/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
