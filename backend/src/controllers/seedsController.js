const { Seed } = require('../models/index');
const Track = require('../models/Track');
const spotifyService = require('../services/spotifyService');
const { upsertTrack } = require('./tracksController');

/**
 * GET /seeds
 * Return all seed tracks for the current user
 */
async function getSeeds(req, res) {
  const seeds = await Seed.find({ userId: req.user._id })
    .populate('trackId', 'title artist albumArt spotifyId previewUrl audioFeatures')
    .sort({ addedAt: -1 });

  res.json(seeds.map((s) => ({ id: s._id, track: s.trackId, addedAt: s.addedAt })));
}

/**
 * POST /seeds
 * Add a Spotify track as a seed. Fetches + caches track if needed.
 * Body: { spotifyId }
 */
async function addSeed(req, res) {
  const { spotifyId } = req.body;
  if (!spotifyId) return res.status(400).json({ error: 'spotifyId is required' });

  // Enforce max 10 seeds
  const count = await Seed.countDocuments({ userId: req.user._id });
  if (count >= 10) {
    return res.status(400).json({ error: 'Maximum 10 seed tracks allowed. Remove one first.' });
  }

  // Ensure track is cached in MongoDB
  let track = await Track.findOne({ spotifyId });
  if (!track) {
    try {
      const client = await spotifyService.getSpotifyClient(req.user);
      const [spotifyTrack, audioFeatures] = await Promise.all([
        spotifyService.getTrack(client, spotifyId),
        spotifyService.getAudioFeaturesForTrack(client, spotifyId),
      ]);
      track = await upsertTrack(spotifyTrack, audioFeatures);
    } catch (err) {
      return res.status(502).json({ error: `Could not fetch track from Spotify: ${err.message}` });
    }
  }

  // Upsert seed (idempotent)
  const seed = await Seed.findOneAndUpdate(
    { userId: req.user._id, trackId: track._id },
    { userId: req.user._id, trackId: track._id, addedAt: new Date() },
    { upsert: true, new: true }
  );

  await seed.populate('trackId', 'title artist albumArt spotifyId previewUrl');
  res.status(201).json({ id: seed._id, track: seed.trackId, addedAt: seed.addedAt });
}

/**
 * DELETE /seeds/:trackId
 * Remove a seed track (by internal MongoDB trackId)
 */
async function removeSeed(req, res) {
  const result = await Seed.findOneAndDelete({
    userId: req.user._id,
    trackId: req.params.trackId,
  });

  if (!result) return res.status(404).json({ error: 'Seed not found' });
  res.json({ success: true });
}

module.exports = { getSeeds, addSeed, removeSeed };
