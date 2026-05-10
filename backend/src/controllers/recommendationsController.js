const { Recommendation, Interaction } = require('../models/index');
const Track = require('../models/Track');
const dnaService = require('../services/dnaService');
const claudeService = require('../services/claudeService');
const logger = require('../utils/logger');

/**
 * GET /recommendations
 * Return personalized recommendations based on user DNA
 */
async function getRecommendations(req, res) {
  const user = req.user;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const forceRefresh = req.query.refresh === 'true';

  if (user.dnaVector.length !== 13) {
    return res.status(400).json({ error: 'DNA not computed yet. POST /dna/compute first.' });
  }

  // Return cached recommendations if fresh (< 24h) and not forcing refresh
  if (!forceRefresh) {
    const cached = await Recommendation.find({ userId: user._id })
      .populate('trackId')
      .sort({ similarityScore: -1 })
      .limit(limit);

    if (cached.length >= limit) {
      return res.json(cached.map(formatRecommendation));
    }
  }

  try {
    // Get tracks the user has already interacted with to exclude
    const interacted = await Interaction.find({ userId: user._id }).select('trackId');
    const excludeIds = interacted.map((i) => i.trackId);

    // Find similar tracks via cosine similarity
    const similar = await dnaService.findSimilarTracks(user.dnaVector, {
      limit,
      excludeIds,
    });

    if (!similar.length) {
      return res.json([]);
    }

    // Generate "why you'll love this" for top results
    const withContext = similar.slice(0, 10).map((s) => ({
      ...s,
      userDNA: user.dnaVector,
    }));
    const withWhyTexts = await claudeService.batchGenerateWhyTexts(withContext);

    // Save recommendations to DB
    await Recommendation.deleteMany({ userId: user._id });
    const saved = await Recommendation.insertMany(
      similar.map((s, i) => ({
        userId: user._id,
        trackId: s.track._id,
        similarityScore: s.similarityScore,
        whyText: withWhyTexts[i]?.whyText || '',
      }))
    );

    // Populate and return
    const populated = await Recommendation.find({
      _id: { $in: saved.map((r) => r._id) },
    }).populate('trackId');

    res.json(populated.map(formatRecommendation));
  } catch (err) {
    logger.error('Recommendations error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /recommendations/mood
 * Parse a natural language mood query and return matching tracks
 */
async function getMoodRecommendations(req, res) {
  const user = req.user;
  const { query } = req.body;

  if (!query?.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }

  if (user.dnaVector.length !== 13) {
    return res.status(400).json({ error: 'DNA not computed yet.' });
  }

  try {
    // Claude parses the mood into audio feature ranges
    const featureFilters = await claudeService.parseMoodQuery(query);
    logger.info(`Mood query "${query}" → filters: ${JSON.stringify(featureFilters)}`);

    const interacted = await Interaction.find({ userId: user._id }).select('trackId');
    const excludeIds = interacted.map((i) => i.trackId);

    // Find tracks matching mood filters, ranked by DNA similarity
    const similar = await dnaService.findSimilarTracks(user.dnaVector, {
      limit: 20,
      excludeIds,
      featureFilters,
    });

    if (!similar.length) {
      return res.json({ results: [], message: 'No tracks found matching that mood. Try a different description!' });
    }

    const withContext = similar.slice(0, 10).map((s) => ({
      ...s,
      userDNA: user.dnaVector,
    }));
    const withWhyTexts = await claudeService.batchGenerateWhyTexts(withContext);

    // Save mood recommendations
    await Recommendation.insertMany(
      similar.map((s, i) => ({
        userId: user._id,
        trackId: s.track._id,
        similarityScore: s.similarityScore,
        whyText: withWhyTexts[i]?.whyText || '',
        moodQuery: query,
      }))
    );

    const populated = await Recommendation.find({
      userId: user._id,
      moodQuery: query,
    }).populate('trackId');

    res.json({
      results: populated.map(formatRecommendation),
      parsedFilters: featureFilters,
    });
  } catch (err) {
    logger.error('Mood recommendations error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

function formatRecommendation(rec) {
  const track = rec.trackId || rec.track;
  return {
    id: rec._id,
    track: {
      id: track._id,
      spotifyId: track.spotifyId,
      title: track.title,
      artist: track.artist,
      album: track.album,
      albumArt: track.albumArt,
      previewUrl: track.previewUrl,
    },
    similarityScore: rec.similarityScore,
    matchPercent: Math.round(rec.similarityScore * 100),
    whyText: rec.whyText,
    moodQuery: rec.moodQuery,
  };
}

module.exports = { getRecommendations, getMoodRecommendations };
