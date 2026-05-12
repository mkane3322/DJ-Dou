require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const morgan    = require('morgan');
const mongoose  = require('mongoose');
const cron      = require('node-cron');
const rateLimit = require('express-rate-limit');

const routes = require('./routes');
const { User, Track } = require('./models');
const { getSpotifyClient, spotifyGet, getAudioFeatures, upsertTrack } = require('./services');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use(routes);
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Catalog indexer ────────────────────────────────────────────────────────────
const SEED_PLAYLISTS = [
  '37i9dQZEVXbMDoHDwVN2tF', // Top 50 Global
  '37i9dQZF1DXcBWIGoYBM5M', // Today's Top Hits
  '37i9dQZF1DX4JAvHpjipBk', // New Music Friday
  '37i9dQZF1DWXRqgorJj26U', // Rock Classics
  '37i9dQZF1DX4dyzvuaRJ0n', // mint (electronic)
  '37i9dQZF1DX0XUsuxWHRQd', // RapCaviar
  '37i9dQZF1DX4sWSpwq3LiO', // Peaceful Piano
];

let indexing = false;
async function runIndexer() {
  if (indexing) return;
  indexing = true;
  console.log('[indexer] Starting...');
  try {
    const adminUser = await User.findOne({ spotifyRefreshToken: { $exists: true } });
    if (!adminUser) { console.log('[indexer] No users yet'); return; }
    const client = await getSpotifyClient(adminUser);
    let total = 0;
    for (const pid of SEED_PLAYLISTS) {
      try {
        const data   = await spotifyGet(client, `/playlists/${pid}/tracks`, { limit: 100, fields: 'items(track(id,name,artists,album,preview_url,popularity))' });
        const tracks = data.items.map((i) => i.track).filter((t) => t?.id);
        const afs    = await getAudioFeatures(client, tracks.map((t) => t.id));
        for (let i = 0; i < tracks.length; i++) {
          if (afs[i]) { await upsertTrack(tracks[i], afs[i]).catch(() => null); total++; }
        }
        await new Promise((r) => setTimeout(r, 400));
      } catch (e) { console.error(`[indexer] Playlist ${pid} failed:`, e.message); }
    }
    console.log(`[indexer] Done. Indexed ${total} tracks.`);
  } catch (e) { console.error('[indexer] Fatal:', e.message); }
  finally { indexing = false; }
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`DJ Dou backend running on port ${PORT}`);
      Track.countDocuments().then((n) => { if (n < 100) runIndexer(); });
      cron.schedule('0 2 * * *', runIndexer, { timezone: 'America/New_York' });
    });
  })
  .catch((err) => { console.error('DB connection failed:', err); process.exit(1); });
