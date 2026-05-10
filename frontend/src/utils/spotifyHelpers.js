/**
 * Frontend Spotify helper utilities.
 * These work with data already returned from the backend —
 * no direct Spotify API calls happen in the frontend.
 */

/**
 * Get the best album art URL from a Spotify images array.
 * @param {Array} images - Spotify images array [{ url, width, height }]
 * @param {string} size - 'small' | 'medium' | 'large'
 */
export function getBestImage(images = [], size = 'medium') {
  if (!images?.length) return null;
  const sorted = [...images].sort((a, b) => (b.width || 0) - (a.width || 0));
  if (size === 'large')  return sorted[0]?.url;
  if (size === 'small')  return sorted[sorted.length - 1]?.url;
  return sorted[Math.floor(sorted.length / 2)]?.url || sorted[0]?.url;
}

/**
 * Format track duration from milliseconds to m:ss
 * @param {number} ms
 */
export function formatDuration(ms) {
  if (!ms) return '0:00';
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format a Spotify artist list to a comma-separated string.
 * @param {Array|string} artists
 */
export function formatArtists(artists) {
  if (typeof artists === 'string') return artists;
  if (!Array.isArray(artists)) return '';
  return artists.map((a) => a.name || a).join(', ');
}

/**
 * Build a Spotify deep-link URL for a track.
 * @param {string} spotifyId
 */
export function spotifyTrackUrl(spotifyId) {
  return `https://open.spotify.com/track/${spotifyId}`;
}

/**
 * Build a Spotify deep-link URL for an artist.
 * @param {string} artistId
 */
export function spotifyArtistUrl(artistId) {
  return `https://open.spotify.com/artist/${artistId}`;
}

/**
 * Returns true if a track has a usable 30s preview.
 * @param {Object} track
 */
export function hasPreview(track) {
  return Boolean(track?.previewUrl);
}

/**
 * Truncate a string to maxLength with ellipsis.
 * @param {string} str
 * @param {number} maxLength
 */
export function truncate(str, maxLength = 40) {
  if (!str) return '';
  return str.length > maxLength ? `${str.slice(0, maxLength)}…` : str;
}

/**
 * Map a Spotify key number (0–11) to its note name.
 */
const KEY_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export function keyName(keyNum) {
  if (keyNum === undefined || keyNum === null || keyNum < 0) return '—';
  return KEY_NAMES[keyNum % 12] || '—';
}

/**
 * Convert a Spotify mode number to a label.
 * @param {number} mode - 0 = minor, 1 = major
 */
export function modeName(mode) {
  return mode === 1 ? 'Major' : 'Minor';
}

/**
 * Get a BPM label from a normalized tempo value (0–1).
 * The backend normalizes tempo from 50–220 BPM.
 */
export function denormalizeTempo(normalized) {
  return Math.round(50 + normalized * 170);
}
