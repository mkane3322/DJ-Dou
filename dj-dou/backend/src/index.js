require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cron = require("node-cron");
const rateLimit = require("express-rate-limit");
const routes = require("./routes");
const { User, Track } = require("./models");
const {
  getClient,
  spotifyGet,
  formatTrack,
  upsertTrack,
} = require("./services");
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use(routes);
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use((err, req, res, next) => {
  console.error(err.message);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal server error" });
});
const SEARCH_QUERIES = [
  "top hits",
  "hip hop",
  "pop",
  "rock",
  "r&b",
  "electronic",
  "jazz",
  "indie",
  "latin",
  "country",
  "soul",
  "metal",
  "reggae",
  "classical",
  "funk",
];
let indexing = false;
async function runIndexer() {
  if (indexing) return;
  indexing = true;
  console.log("[indexer] Starting...");
  try {
    const adminUser = await User.findOne({
      spotifyRefreshToken: { $exists: true },
    });
    if (!adminUser) {
      console.log("[indexer] No users yet");
      return;
    }
    const client = await getClient(adminUser);
    let total = 0;
    for (const q of SEARCH_QUERIES) {
      try {
        const data = await spotifyGet(client, "/search", {
          q,
          type: "track",
          limit: 50,
        });
        const tracks = data.tracks?.items?.filter((t) => t?.id) || [];

        // Try to get audio features for this batch — may 403 on restricted apps
        let featureMap = new Map();
        try {
          const ids = tracks.map((t) => t.id);
          const { audio_features } = await spotifyGet(
            client,
            "/audio-features",
            { ids: ids.join(",") },
          );
          (audio_features || [])
            .filter(Boolean)
            .forEach((af) => featureMap.set(af.id, af));
        } catch {
          /* audio features not available — save basic info only */
        }

        for (const t of tracks) {
          const af = featureMap.get(t.id) || null;
          await upsertTrack(t, af).catch(() => null);
          total++;
        }

        await new Promise((r) => setTimeout(r, 250));
      } catch (e) {
        console.error(`[indexer] Query "${q}" failed:`, e.message);
      }
    }
    console.log(`[indexer] Done. Indexed ${total} tracks.`);
  } catch (e) {
    console.error("[indexer] Fatal:", e.message);
  } finally {
    indexing = false;
  }
}
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`DJ Dou backend running on port ${PORT}`);
      Track.countDocuments().then((n) => {
        console.log(`[indexer] Catalog has ${n} tracks`);
        if (n < 200) runIndexer();
      });
      cron.schedule("0 2 * * *", runIndexer, { timezone: "America/New_York" });
    });
  })
  .catch((err) => {
    console.error("DB failed:", err);
    process.exit(1);
  });
