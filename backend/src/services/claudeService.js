const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../utils/logger');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Generate a personalized SoundDNA summary paragraph for the user.
 *
 * @param {Object} interpretation - Result of dnaService.interpretDNAVector()
 * @param {string} displayName - User's Spotify display name
 * @returns {string} Plain-English DNA summary
 */
async function generateDNASummary(interpretation, displayName) {
  const traits = Object.entries(interpretation)
    .map(([key, { value, label }]) => `${key}: ${label} (${(value * 100).toFixed(0)}%)`)
    .join('\n');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `You are DJ Dou, a music personality analyst. Based on the audio DNA profile below, write a 2-3 sentence description of ${displayName || "this listener"}'s musical identity. Make it feel personal, insightful, and a little poetic — like a horoscope but for music taste. Don't list the stats; synthesize them into a vivid personality portrait.

Audio DNA Profile:
${traits}

Write only the description paragraph, nothing else.`,
      },
    ],
  });

  return message.content[0].text.trim();
}

/**
 * Generate a "why you'll love this" explanation for a recommended track.
 *
 * @param {Object} track - Track document
 * @param {number[]} userDNA - User's DNA vector
 * @param {number} similarityScore - Cosine similarity (0-1)
 * @returns {string} Explanation text
 */
async function generateWhyText(track, userDNA, similarityScore) {
  const matchPercent = Math.round(similarityScore * 100);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 120,
    messages: [
      {
        role: 'user',
        content: `Write a single punchy sentence (max 20 words) explaining why a user would love the track "${track.title}" by ${track.artist}. The track is a ${matchPercent}% DNA match. Focus on vibe, emotion, or a specific musical quality. Be specific, not generic.`,
      },
    ],
  });

  return message.content[0].text.trim();
}

/**
 * Parse a natural language mood query into Spotify audio feature ranges.
 *
 * @param {string} moodQuery - e.g. "something melancholic and slow for a rainy day"
 * @returns {Object} Feature ranges, e.g. { valence: [0, 0.3], energy: [0, 0.4] }
 */
async function parseMoodQuery(moodQuery) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Convert this music mood description into Spotify audio feature ranges. Respond ONLY with a valid JSON object and nothing else — no preamble, no backticks, no explanation.

The JSON should have only the most relevant 2-4 features from this list as keys:
- danceability (0-1)
- energy (0-1)  
- valence (0-1, where 0=sad/dark, 1=happy/bright)
- tempo (0-1, where 0=very slow, 1=very fast)
- acousticness (0-1)
- instrumentalness (0-1)
- speechiness (0-1)

Each key maps to an array [min, max].

Mood: "${moodQuery}"

Example output: {"valence":[0,0.3],"energy":[0,0.4],"tempo":[0,0.45]}`,
      },
    ],
  });

  const rawText = message.content[0].text.trim();

  try {
    const parsed = JSON.parse(rawText);
    // Validate: each value must be [min, max] array with numbers in [0,1]
    const valid = {};
    for (const [key, range] of Object.entries(parsed)) {
      if (
        Array.isArray(range) &&
        range.length === 2 &&
        typeof range[0] === 'number' &&
        typeof range[1] === 'number'
      ) {
        valid[key] = [Math.max(0, range[0]), Math.min(1, range[1])];
      }
    }
    return valid;
  } catch (err) {
    logger.error('Failed to parse Claude mood response:', rawText);
    return {}; // Fall back to no filters
  }
}

/**
 * Batch generate "why" texts for multiple recommendations.
 * Uses Promise.all with a small delay to avoid rate limits.
 */
async function batchGenerateWhyTexts(recommendations) {
  const results = [];

  for (const rec of recommendations) {
    try {
      const whyText = await generateWhyText(rec.track, rec.userDNA, rec.similarityScore);
      results.push({ ...rec, whyText });
    } catch (err) {
      logger.error(`Failed to generate why text for track ${rec.track.spotifyId}:`, err.message);
      results.push({ ...rec, whyText: `A ${Math.round(rec.similarityScore * 100)}% match with your SoundDNA.` });
    }
    // Small delay to be kind to the API
    await new Promise((r) => setTimeout(r, 100));
  }

  return results;
}

module.exports = {
  generateDNASummary,
  generateWhyText,
  parseMoodQuery,
  batchGenerateWhyTexts,
};
