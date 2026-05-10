/**
 * Normalization ranges for each Spotify audio feature.
 * Maps raw Spotify values → [0, 1].
 */
const FEATURE_RANGES = {
  danceability:     { min: 0,       max: 1 },
  energy:           { min: 0,       max: 1 },
  key:              { min: 0,       max: 11 },
  loudness:         { min: -60,     max: 0 },
  mode:             { min: 0,       max: 1 },
  speechiness:      { min: 0,       max: 1 },
  acousticness:     { min: 0,       max: 1 },
  instrumentalness: { min: 0,       max: 1 },
  liveness:         { min: 0,       max: 1 },
  valence:          { min: 0,       max: 1 },
  tempo:            { min: 50,      max: 220 },
  duration_ms:      { min: 30000,   max: 600000 },
  time_signature:   { min: 1,       max: 7 },
};

// The canonical order — must match Track.AUDIO_FEATURE_KEYS
const FEATURE_ORDER = [
  'danceability',
  'energy',
  'key',
  'loudness',
  'mode',
  'speechiness',
  'acousticness',
  'instrumentalness',
  'liveness',
  'valence',
  'tempo',
  'duration_ms',
  'time_signature',
];

/**
 * Normalize a single value from its raw Spotify range to [0, 1].
 */
function normalizeValue(feature, rawValue) {
  const range = FEATURE_RANGES[feature];
  if (!range) return 0;
  const clamped = Math.max(range.min, Math.min(range.max, rawValue));
  return (clamped - range.min) / (range.max - range.min);
}

/**
 * Normalize all audio features in an object to [0, 1].
 * @param {Object} audioFeatures - Raw Spotify audio features object
 * @returns {Object} Normalized features
 */
function normalizeFeatures(audioFeatures) {
  const normalized = {};
  for (const feature of FEATURE_ORDER) {
    const raw = audioFeatures[feature];
    normalized[feature] = raw !== undefined && raw !== null
      ? normalizeValue(feature, raw)
      : 0;
  }
  return normalized;
}

/**
 * Build the 13-element feature vector from a normalized features object.
 * Order matches FEATURE_ORDER / Track.AUDIO_FEATURE_KEYS.
 * @param {Object} normalizedFeatures
 * @returns {number[]}
 */
function buildFeatureVector(normalizedFeatures) {
  return FEATURE_ORDER.map((f) => normalizedFeatures[f] ?? 0);
}

/**
 * Convert a raw Spotify audio features object directly to a vector.
 */
function audioFeaturesToVector(audioFeatures) {
  return buildFeatureVector(normalizeFeatures(audioFeatures));
}

module.exports = {
  FEATURE_ORDER,
  FEATURE_RANGES,
  normalizeValue,
  normalizeFeatures,
  buildFeatureVector,
  audioFeaturesToVector,
};
