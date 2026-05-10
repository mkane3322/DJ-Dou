/**
 * Labels and metadata for each of the 13 audio feature dimensions.
 * Index order matches the backend featureVector / FEATURE_ORDER.
 */
export const FEATURE_META = [
  { key: 'danceability',     label: 'Danceability',   icon: '💃', color: '#a855f7', description: 'How suitable a track is for dancing' },
  { key: 'energy',           label: 'Energy',         icon: '⚡', color: '#f472b6', description: 'Intensity and activity level' },
  { key: 'key',              label: 'Key',            icon: '🎹', color: '#22d3ee', description: 'Musical key of the track' },
  { key: 'loudness',         label: 'Loudness',       icon: '🔊', color: '#fb923c', description: 'Overall loudness in decibels' },
  { key: 'mode',             label: 'Mode',           icon: '🎼', color: '#34d399', description: 'Major (bright) vs minor (dark)' },
  { key: 'speechiness',      label: 'Speechiness',    icon: '🎤', color: '#f59e0b', description: 'Presence of spoken words' },
  { key: 'acousticness',     label: 'Acoustic',       icon: '🪕', color: '#60a5fa', description: 'Confidence track is acoustic' },
  { key: 'instrumentalness', label: 'Instrumental',   icon: '🎸', color: '#c084fc', description: 'Absence of vocals' },
  { key: 'liveness',         label: 'Liveness',       icon: '🎭', color: '#f87171', description: 'Presence of live audience' },
  { key: 'valence',          label: 'Positivity',     icon: '☀️', color: '#fbbf24', description: 'Musical positiveness / happiness' },
  { key: 'tempo',            label: 'Tempo',          icon: '🥁', color: '#a3e635', description: 'Beats per minute' },
  { key: 'duration',         label: 'Duration',       icon: '⏱',  color: '#94a3b8', description: 'Track length' },
  { key: 'time_signature',   label: 'Time Sig',       icon: '🎵', color: '#e879f9', description: 'Beats per bar' },
];

/** The 8 features shown in the radar chart */
export const RADAR_FEATURE_KEYS = [
  'danceability', 'energy', 'valence', 'acousticness',
  'tempo', 'instrumentalness', 'speechiness', 'liveness',
];

/**
 * Get a human-readable label for a normalized feature value.
 * @param {string} key - Feature key
 * @param {number} value - Normalized value 0–1
 */
export function describeFeatureValue(key, value) {
  const descriptors = {
    danceability: ['static', 'plodding', 'rhythmic', 'groovy', 'irresistible'],
    energy:       ['ambient', 'mellow', 'moderate', 'intense', 'explosive'],
    valence:      ['dark', 'melancholic', 'neutral', 'upbeat', 'euphoric'],
    acousticness: ['fully electronic', 'mostly produced', 'mixed', 'mostly acoustic', 'purely acoustic'],
    speechiness:  ['purely musical', 'mostly sung', 'mixed', 'rap-adjacent', 'spoken word'],
    instrumentalness: ['vocal-forward', 'mostly vocals', 'balanced', 'mostly instrumental', 'purely instrumental'],
    liveness:     ['studio-clean', 'very produced', 'some ambience', 'live feel', 'concert recording'],
    tempo:        ['very slow', 'slow', 'mid-tempo', 'fast', 'frenetic'],
  };

  const scale = descriptors[key];
  if (!scale) return `${Math.round(value * 100)}%`;
  const idx = Math.min(4, Math.floor(value * 5));
  return scale[idx];
}

/**
 * Compute the cosine similarity between two 13-dimension vectors (client-side preview).
 */
export function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Format a match percentage for display.
 * @param {number} score - 0 to 1 cosine similarity
 */
export function formatMatch(score) {
  return `${Math.round(score * 100)}%`;
}

/**
 * Get a color for a match percentage.
 */
export function matchColor(score) {
  if (score >= 0.85) return '#a3e635'; // lime — great match
  if (score >= 0.7)  return '#a855f7'; // purple — good match
  if (score >= 0.5)  return '#22d3ee'; // cyan — decent match
  return '#9d8fc4';                    // muted — weak match
}
