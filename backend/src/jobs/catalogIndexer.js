const cron = require('node-cron');
const spotifyService = require('../services/spotifyService');
const { upsertTrack } = require('../controllers/tracksController');
const User = require('../models/User');
const logger = require('../utils/logger');

// Featured playlist IDs to index — a mix of genre-diverse editorial playlists
const SEED_PLAYLIST_IDS = [
  '37i9dQZEVXbMDoHDwVN2tF', // Top 50 Global
  '37i9dQZEVXbLRQDuF5jeBp', // Top 50 USA
  '37i9dQZF1DXcBWIGoYBM5M', // Today's Top Hits
  '37i9dQZF1DX4JAvHpjipBk', // New Music Friday
  '37i9dQZF1DWXRqgorJj26U', // Rock Classics
  '37i9dQZF1DX4dyzvuaRJ0n', // mint (electronic)
  '37i9dQZF1DX0XUsuxWHRQd', // RapCaviar
  '37i9dQZF1DX4sWSpwq3LiO', // Peaceful Piano
];

let isIndexing = false;

/**
 * Index tracks from seed playlists into MongoDB.
 * Runs nightly at 2 AM.
 */
async function runCatalogIndexer() {
  if (isIndexing) {
    logger.info('Catalog indexer already running, skipping.');
    return;
  }

  isIndexing = true;
  logger.info('Catalog indexer starting...');

  try {
    // Use the first user's token to make Spotify API calls
    // In production you'd use a dedicated service account or app-level token
    const adminUser = await User.findOne({ spotifyRefreshToken: { $exists: true } });
    if (!adminUser) {
      logger.warn('No users found for catalog indexing. Skipping.');
      return;
    }

    const spotifyClient = await spotifyService.getSpotifyClient(adminUser);
    let totalIndexed = 0;
    let totalErrors = 0;

    for (const playlistId of SEED_PLAYLIST_IDS) {
      try {
        logger.info(`Indexing playlist ${playlistId}...`);
        const tracks = await spotifyService.getPlaylistTracks(spotifyClient, playlistId, 100);
        const validTracks = tracks.filter((t) => t?.id);
        const ids = validTracks.map((t) => t.id);

        if (!ids.length) continue;

        const audioFeaturesArr = await spotifyService.getAudioFeatures(spotifyClient, ids);

        for (let i = 0; i < validTracks.length; i++) {
          if (audioFeaturesArr[i]) {
            await upsertTrack(validTracks[i], audioFeaturesArr[i]).catch(() => null);
            totalIndexed++;
          }
        }

        // Be polite to Spotify's rate limits
        await sleep(500);
      } catch (err) {
        logger.error(`Failed to index playlist ${playlistId}:`, err.message);
        totalErrors++;
      }
    }

    logger.info(`Catalog indexer complete. Indexed: ${totalIndexed}, Errors: ${totalErrors}`);
  } catch (err) {
    logger.error('Catalog indexer fatal error:', err.message);
  } finally {
    isIndexing = false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Start the scheduled cron job.
 * Schedule: 2:00 AM every day.
 */
function startCatalogIndexer() {
  logger.info('Catalog indexer scheduled: runs daily at 2:00 AM');

  // Run once at startup if catalog is empty
  const Track = require('../models/Track');
  Track.countDocuments().then((count) => {
    if (count < 100) {
      logger.info(`Catalog has only ${count} tracks — running initial index now.`);
      runCatalogIndexer();
    }
  });

  cron.schedule('0 2 * * *', runCatalogIndexer, {
    timezone: 'America/New_York',
  });
}

module.exports = { startCatalogIndexer, runCatalogIndexer };
