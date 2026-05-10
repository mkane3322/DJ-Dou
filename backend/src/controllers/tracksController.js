const Track = require('../models/Track');
const spotifyService = require('../services/spotifyService');
const { audioFeaturesToVector } = require('../utils/featureNormalizer');
const logger = require('../utils/logger');

/**
 * GET /tracks/search?q=&limit=
 * Search Spotify and optionally cache results in MongoDB
 */
async function searchTracks(req, res) {
  const { q, limit = 20 } = req.query;
  if (!q?.trim()) return res.status(400).json({ error: 'q is required' });

  try {
    const spotifyClient = await spotifyService.getSpotifyClient(req.user);
    const results = await spotifyService.searchTracks(spotifyClient, q, parseInt(limit));

    // Cache any new tracks in the background
    cacheTracksWithFeatures(spotifyClient, results).catch((err) =>
      logger.error('Background cache error:', err.message)
    );

    res.json(results.map(spotifyService.formatTrack));
  } catch (err) {
    logger.error('Track search error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /tracks/:spotifyId
 * Get a single track with audio features (from cache or Spotify)
 */
async function getTrack(req, res) {
  const { spotifyId } = req.params;

  // Check cache first
  let track = await Track.findOne({ spotifyId });
  if (track) return res.json(track);

  try {
    const spotifyClient = await spotifyService.getSpotifyClient(req.user);
    const [spotifyTrack, audioFeatures] = await Promise.all([
      spotifyService.getTrack(spotifyClient, spotifyId),
      spotifyService.getAudioFeaturesForTrack(spotifyClient, spotifyId),
    ]);

    track = await upsertTrack(spotifyTrack, audioFeatures);
    res.json(track);
  } catch (err) {
    logger.error('Get track error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Helper: cache tracks + their audio features into MongoDB
 */
async function cacheTracksWithFeatures(spotifyClient, spotifyTracks) {
  if (!spotifyTracks.length) return;

  const ids = spotifyTracks.map((t) => t.id);
  const audioFeaturesArr = await spotifyService.getAudioFeatures(spotifyClient, ids);

  for (let i = 0; i < spotifyTracks.length; i++) {
    if (audioFeaturesArr[i]) {
      await upsertTrack(spotifyTracks[i], audioFeaturesArr[i]).catch(() => null);
    }
  }
}

/**
 * Upsert a track document with its feature vector
 */
async function upsertTrack(spotifyTrack, audioFeatures) {
  const formatted = spotifyService.formatTrack(spotifyTrack);
  const featureVector = audioFeaturesToVector(audioFeatures);

  return Track.findOneAndUpdate(
    { spotifyId: formatted.spotifyId },
    {
      ...formatted,
      audioFeatures: {
        danceability: audioFeatures.danceability,
        energy: audioFeatures.energy,
        key: audioFeatures.key,
        loudness: audioFeatures.loudness,
        mode: audioFeatures.mode,
        speechiness: audioFeatures.speechiness,
        acousticness: audioFeatures.acousticness,
        instrumentalness: audioFeatures.instrumentalness,
        liveness: audioFeatures.liveness,
        valence: audioFeatures.valence,
        tempo: audioFeatures.tempo,
        duration_ms: audioFeatures.duration_ms,
        time_signature: audioFeatures.time_signature,
      },
      featureVector,
      cachedAt: new Date(),
    },
    { upsert: true, new: true }
  );
}

module.exports = { searchTracks, getTrack, cacheTracksWithFeatures, upsertTrack };
