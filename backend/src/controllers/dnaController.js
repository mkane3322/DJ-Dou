const dnaService = require('../services/dnaService');
const claudeService = require('../services/claudeService');
const spotifyService = require('../services/spotifyService');
const { FEATURE_ORDER } = require('../utils/featureNormalizer');
const logger = require('../utils/logger');

/**
 * GET /dna/profile
 * Return the user's DNA vector, summary, and radar chart data
 */
async function getDNAProfile(req, res) {
  const user = req.user;

  if (user.dnaVector.length !== 13) {
    return res.status(404).json({
      error: 'DNA not yet computed. POST /dna/compute to generate it.',
    });
  }

  res.json({
    dnaVector: user.dnaVector,
    dnaSummary: user.dnaSummary,
    dnaComputedAt: user.dnaComputedAt,
    chartData: buildRadarChartData(user.dnaVector),
  });
}

/**
 * POST /dna/compute
 * (Re)compute the user's DNA from their Spotify history and generate a summary
 */
async function computeDNA(req, res) {
  const user = req.user;

  try {
    const spotifyClient = await spotifyService.getSpotifyClient(user);
    const dnaVector = await dnaService.computeDNAVector(user, spotifyClient);
    const interpretation = dnaService.interpretDNAVector(dnaVector);
    const dnaSummary = await claudeService.generateDNASummary(
      interpretation,
      user.displayName
    );

    user.dnaVector = dnaVector;
    user.dnaSummary = dnaSummary;
    user.dnaComputedAt = new Date();
    await user.save();

    logger.info(`DNA computed for user ${user.spotifyId}`);

    res.json({
      dnaVector,
      dnaSummary,
      dnaComputedAt: user.dnaComputedAt,
      chartData: buildRadarChartData(dnaVector),
    });
  } catch (err) {
    logger.error('DNA compute error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /dna/chart-data
 * Return formatted data for the D3 radar chart
 */
function getChartData(req, res) {
  const user = req.user;
  if (user.dnaVector.length !== 13) {
    return res.status(404).json({ error: 'DNA not computed yet' });
  }
  res.json(buildRadarChartData(user.dnaVector));
}

/**
 * Build the radar chart data structure for D3.
 * Only includes the 8 most visually meaningful dimensions.
 */
function buildRadarChartData(dnaVector) {
  const RADAR_FEATURES = [
    { key: 'danceability', label: 'Danceability', index: 0 },
    { key: 'energy',       label: 'Energy',       index: 1 },
    { key: 'valence',      label: 'Positivity',   index: 9 },
    { key: 'acousticness', label: 'Acoustic',      index: 6 },
    { key: 'tempo',        label: 'Tempo',         index: 10 },
    { key: 'instrumentalness', label: 'Instrumental', index: 7 },
    { key: 'speechiness',  label: 'Speechiness',  index: 5 },
    { key: 'liveness',     label: 'Liveness',     index: 8 },
  ];

  return RADAR_FEATURES.map(({ key, label, index }) => ({
    axis: label,
    key,
    value: Math.round(dnaVector[index] * 100) / 100,
  }));
}

module.exports = { getDNAProfile, computeDNA, getChartData };
