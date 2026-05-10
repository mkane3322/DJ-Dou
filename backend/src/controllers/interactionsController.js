const { Interaction } = require('../models/index');
const Track = require('../models/Track');

/**
 * POST /interactions
 * Log a user action (liked, skipped, saved) on a track
 */
async function logInteraction(req, res) {
  const { trackId, action } = req.body;

  if (!trackId || !action) {
    return res.status(400).json({ error: 'trackId and action are required' });
  }
  if (!['liked', 'skipped', 'saved'].includes(action)) {
    return res.status(400).json({ error: 'action must be liked, skipped, or saved' });
  }

  const track = await Track.findById(trackId);
  if (!track) return res.status(404).json({ error: 'Track not found' });

  // Upsert — one interaction per user/track pair (update action if changed)
  const interaction = await Interaction.findOneAndUpdate(
    { userId: req.user._id, trackId },
    { userId: req.user._id, trackId, action, createdAt: new Date() },
    { upsert: true, new: true }
  );

  res.json({ id: interaction._id, action: interaction.action });
}

/**
 * GET /interactions/history?limit=&action=
 * Return the user's interaction history
 */
async function getHistory(req, res) {
  const { limit = 50, action } = req.query;
  const query = { userId: req.user._id };
  if (action) query.action = action;

  const history = await Interaction.find(query)
    .populate('trackId', 'title artist albumArt spotifyId previewUrl')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json(history);
}

/**
 * DELETE /interactions/:trackId
 * Remove an interaction (un-like, un-save)
 */
async function removeInteraction(req, res) {
  await Interaction.findOneAndDelete({
    userId: req.user._id,
    trackId: req.params.trackId,
  });
  res.json({ success: true });
}

module.exports = { logInteraction, getHistory, removeInteraction };
