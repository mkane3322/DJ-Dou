const Track = require('../models/Track');
const { normalizeFeatures, buildFeatureVector } = require('../utils/featureNormalizer');
const { cosineSimilarity } = require('../utils/cosineSimilarity');
const spotifyService = require('./spotifyService');
const claudeService = require('./claudeService');
const logger = require('../utils/logger');

/**
 * Compute a user's DNA vector from their top Spotify tracks.
 * Weights recent tracks more heavily.
 *
 * @param {Object} user - User document
 * @param {Object} spotifyClient - Authenticated Spotify Axios client
 * @returns {number[]} 13-dimension DNA vector
 */
async function computeDNAVector(user, spotifyClient) {
  logger.info(`Computing DNA vector for user ${user.spotifyId}`);

  // Pull top tracks across all time ranges
  const [shortTerm, mediumTerm, longTerm] = await Promise.all([
    spotifyService.getTopTracks(spotifyClient, 'short_term', 50),
    spotifyService.getTopTracks(spotifyClient, 'medium_term', 50),
    spotifyService.getTopTracks(spotifyClient, 'long_term', 50),
  ]);

  // Weight: short=3, medium=2, long=1 (recency bias)
  const weightedTracks = [
    ...shortTerm.map((t) => ({ track: t, weight: 3 })),
    ...mediumTerm.map((t) => ({ track: t, weight: 2 })),
    ...longTerm.map((t) => ({ track: t, weight: 1 })),
  ];

  // Deduplicate by Spotify ID, keeping highest weight
  const trackMap = new Map();
  for (const { track, weight } of weightedTracks) {
    if (!trackMap.has(track.id) || trackMap.get(track.id).weight < weight) {
      trackMap.set(track.id, { track, weight });
    }
  }

  const uniqueTracks = Array.from(trackMap.values());
  const trackIds = uniqueTracks.map(({ track }) => track.id);

  if (!trackIds.length) {
    throw new Error('No top tracks found — user needs more Spotify history');
  }

  // Fetch audio features for all tracks
  const audioFeatures = await spotifyService.getAudioFeatures(spotifyClient, trackIds);

  // Build weighted average vector
  const dnaVector = computeWeightedAverage(
    audioFeatures,
    uniqueTracks.map(({ weight }) => weight)
  );

  logger.info(`DNA vector computed: [${dnaVector.map((v) => v.toFixed(3)).join(', ')}]`);
  return dnaVector;
}

/**
 * Compute a weighted average of audio feature vectors
 */
function computeWeightedAverage(audioFeaturesArray, weights) {
  const keys = Track.AUDIO_FEATURE_KEYS;
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  const sums = new Array(13).fill(0);

  audioFeaturesArray.forEach((features, i) => {
    if (!features) return;
    const normalized = normalizeFeatures(features);
    const vector = buildFeatureVector(normalized);
    const weight = weights[i] || 1;

    vector.forEach((val, j) => {
      sums[j] += val * weight;
    });
  });

  return sums.map((sum) => sum / totalWeight);
}

/**
 * Find tracks from our catalog most similar to the user's DNA
 *
 * @param {number[]} dnaVector - User's 13-dimension DNA vector
 * @param {Object} options - { limit, excludeIds, featureFilters }
 * @returns {Array} Sorted array of { track, similarityScore }
 */
async function findSimilarTracks(dnaVector, options = {}) {
  const { limit = 20, excludeIds = [], featureFilters = {} } = options;

  // Build MongoDB query
  const query = { featureVector: { $exists: true, $not: { $size: 0 } } };

  if (excludeIds.length) {
    query._id = { $nin: excludeIds };
  }

  // Apply audio feature range filters (from mood search)
  for (const [feature, [min, max]] of Object.entries(featureFilters)) {
    query[`audioFeatures.${feature}`] = { $gte: min, $lte: max };
  }

  // Pull candidates (cap at 10k for in-memory similarity)
  const candidates = await Track.find(query).limit(10000).lean();

  if (!candidates.length) return [];

  // Compute cosine similarity for each candidate
  const scored = candidates
    .map((track) => ({
      track,
      similarityScore: cosineSimilarity(dnaVector, track.featureVector),
    }))
    .filter(({ similarityScore }) => !isNaN(similarityScore))
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);

  return scored;
}

/**
 * Get a summary of what the DNA vector means in musical terms
 * (used to feed Claude for the plain-English description)
 */
function interpretDNAVector(dnaVector) {
  const [
    danceability,
    energy,
    key,
    loudness,
    mode,
    speechiness,
    acousticness,
    instrumentalness,
    liveness,
    valence,
    tempo,
    duration_ms,
    time_signature,
  ] = dnaVector;

  return {
    danceability: { value: danceability, label: danceability > 0.7 ? 'highly danceable' : danceability > 0.4 ? 'moderately danceable' : 'not very danceable' },
    energy: { value: energy, label: energy > 0.7 ? 'high energy' : energy > 0.4 ? 'moderate energy' : 'low energy, calm' },
    valence: { value: valence, label: valence > 0.7 ? 'happy and positive' : valence > 0.4 ? 'mixed emotional tone' : 'melancholic or dark' },
    tempo: { value: tempo, label: tempo > 0.7 ? 'fast-paced' : tempo > 0.4 ? 'mid-tempo' : 'slow' },
    acousticness: { value: acousticness, label: acousticness > 0.7 ? 'very acoustic' : acousticness > 0.4 ? 'somewhat acoustic' : 'electronic/produced' },
    instrumentalness: { value: instrumentalness, label: instrumentalness > 0.5 ? 'mostly instrumental' : 'vocal-forward' },
    speechiness: { value: speechiness, label: speechiness > 0.6 ? 'rap/spoken word heavy' : 'sung vocals' },
    liveness: { value: liveness, label: liveness > 0.8 ? 'live recordings' : 'studio recordings' },
    mode: { value: mode, label: mode > 0.5 ? 'major key (uplifting)' : 'minor key (introspective)' },
  };
}

module.exports = {
  computeDNAVector,
  computeWeightedAverage,
  findSimilarTracks,
  interpretDNAVector,
};
