const axios = require('axios');
const logger = require('../utils/logger');

const SPOTIFY_API = 'https://api.spotify.com/v1';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';

const SCOPES = [
  'user-read-email',
  'user-read-private',
  'user-top-read',
  'user-read-recently-played',
  'playlist-read-private',
].join(' ');

/**
 * Build the Spotify OAuth authorization URL
 */
function getAuthUrl() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: SCOPES,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    show_dialog: 'false',
  });
  return `${SPOTIFY_AUTH_URL}?${params}`;
}

/**
 * Exchange authorization code for access + refresh tokens
 */
async function exchangeCode(code) {
  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const response = await axios.post(
    SPOTIFY_TOKEN_URL,
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    }),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data; // { access_token, refresh_token, expires_in }
}

/**
 * Refresh an expired access token
 */
async function refreshAccessToken(refreshToken) {
  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const response = await axios.post(
    SPOTIFY_TOKEN_URL,
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data; // { access_token, expires_in }
}

/**
 * Create an Axios instance with a valid Spotify access token.
 * Automatically refreshes if the token is expired.
 */
async function getSpotifyClient(user) {
  let accessToken = user.spotifyAccessToken;

  if (user.tokenExpiresAt && new Date() >= user.tokenExpiresAt) {
    logger.info(`Refreshing Spotify token for user ${user.spotifyId}`);
    const refreshed = await refreshAccessToken(user.spotifyRefreshToken);
    accessToken = refreshed.access_token;

    // Persist the new token
    user.spotifyAccessToken = accessToken;
    user.tokenExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
    await user.save();
  }

  return axios.create({
    baseURL: SPOTIFY_API,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

/**
 * Get current user's Spotify profile
 */
async function getProfile(client) {
  const { data } = await client.get('/me');
  return data;
}

/**
 * Get user's top tracks (short/medium/long term)
 */
async function getTopTracks(client, timeRange = 'medium_term', limit = 50) {
  const { data } = await client.get('/me/top/tracks', {
    params: { time_range: timeRange, limit },
  });
  return data.items;
}

/**
 * Get audio features for up to 100 tracks at once
 */
async function getAudioFeatures(client, trackIds) {
  if (!trackIds.length) return [];

  // Spotify accepts max 100 IDs per request
  const chunks = [];
  for (let i = 0; i < trackIds.length; i += 100) {
    chunks.push(trackIds.slice(i, i + 100));
  }

  const results = [];
  for (const chunk of chunks) {
    const { data } = await client.get('/audio-features', {
      params: { ids: chunk.join(',') },
    });
    results.push(...(data.audio_features || []));
  }

  return results.filter(Boolean); // Remove nulls (tracks without features)
}

/**
 * Get audio features for a single track
 */
async function getAudioFeaturesForTrack(client, trackId) {
  const { data } = await client.get(`/audio-features/${trackId}`);
  return data;
}

/**
 * Search Spotify catalog
 */
async function searchTracks(client, query, limit = 20) {
  const { data } = await client.get('/search', {
    params: { q: query, type: 'track', limit },
  });
  return data.tracks.items;
}

/**
 * Get a track by ID
 */
async function getTrack(client, trackId) {
  const { data } = await client.get(`/tracks/${trackId}`);
  return data;
}

/**
 * Get multiple tracks by IDs (max 50)
 */
async function getTracks(client, trackIds) {
  const { data } = await client.get('/tracks', {
    params: { ids: trackIds.join(',') },
  });
  return data.tracks;
}

/**
 * Get tracks from a playlist
 */
async function getPlaylistTracks(client, playlistId, limit = 100) {
  const { data } = await client.get(`/playlists/${playlistId}/tracks`, {
    params: { limit, fields: 'items(track(id,name,artists,album,preview_url,popularity))' },
  });
  return data.items.map((item) => item.track).filter(Boolean);
}

/**
 * Get recommendations from Spotify (seed-based)
 */
async function getSpotifyRecommendations(client, seedTrackIds, limit = 20) {
  const { data } = await client.get('/recommendations', {
    params: {
      seed_tracks: seedTrackIds.slice(0, 5).join(','),
      limit,
    },
  });
  return data.tracks;
}

/**
 * Format a Spotify track object into our internal format
 */
function formatTrack(spotifyTrack) {
  return {
    spotifyId: spotifyTrack.id,
    title: spotifyTrack.name,
    artist: spotifyTrack.artists?.map((a) => a.name).join(', ') || '',
    album: spotifyTrack.album?.name || '',
    albumArt: spotifyTrack.album?.images?.[0]?.url || '',
    previewUrl: spotifyTrack.preview_url || null,
    popularity: spotifyTrack.popularity || 0,
  };
}

module.exports = {
  getAuthUrl,
  exchangeCode,
  refreshAccessToken,
  getSpotifyClient,
  getProfile,
  getTopTracks,
  getAudioFeatures,
  getAudioFeaturesForTrack,
  searchTracks,
  getTrack,
  getTracks,
  getPlaylistTracks,
  getSpotifyRecommendations,
  formatTrack,
};
