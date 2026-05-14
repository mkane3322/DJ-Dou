const router = require("express").Router();
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const cloudinary = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const axios = require("axios");
const { User, Track, Seed, Interaction, Recommendation } = require("./models");
const svc = require("./services");
async function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer "))
    return res.status(401).json({ error: "Missing token" });
  try {
    const { userId } = jwt.verify(h.slice(7), process.env.JWT_SECRET);
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
const claudeLimit = rateLimit({ windowMs: 60_000, max: 10 });
const authLimit = rateLimit({ windowMs: 3_600_000, max: 20 });
router.get("/auth/spotify", authLimit, (req, res) => {
  res.redirect(svc.getAuthUrl());
});
router.get("/auth/spotify/callback", async (req, res) => {
  const { code, error } = req.query;
  if (error || !code)
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=denied`);
  try {
    const tokens = await svc.exchangeCode(code);
    const tmpClient = axios.create({
      baseURL: "https://api.spotify.com/v1",
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await svc.spotifyGet(tmpClient, "/me");
    const user = await User.findOneAndUpdate(
      { spotifyId: profile.id },
      {
        spotifyId: profile.id,
        email: profile.email,
        displayName: profile.display_name,
        avatar: profile.images?.[0]?.url || "",
        spotifyAccessToken: tokens.access_token,
        spotifyRefreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
  } catch (err) {
    console.error("Auth callback error:", err.message);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
});
router.get("/auth/me", requireAuth, (req, res) => {
  const u = req.user;
  res.json({
    id: u._id,
    spotifyId: u.spotifyId,
    email: u.email,
    displayName: u.displayName,
    avatar: u.avatar,
    hasDNA: u.dnaVector.length === 13,
    dnaSummary: u.dnaSummary,
    dnaComputedAt: u.dnaComputedAt,
  });
});
router.get("/dna/profile", requireAuth, (req, res) => {
  const u = req.user;
  if (u.dnaVector.length !== 13)
    return res.status(404).json({ error: "DNA not computed yet" });
  res.json({
    dnaVector: u.dnaVector,
    dnaSummary: u.dnaSummary,
    dnaComputedAt: u.dnaComputedAt,
    chartData: svc.buildChartData(u.dnaVector),
  });
});
router.post("/dna/compute", requireAuth, async (req, res) => {
  try {
    const client = await svc.getSpotifyClient(req.user);
    const dnaVector = await svc.computeDNAVector(req.user, client);
    const dnaSummary = await svc.generateDNASummary(
      svc.interpretDNA(dnaVector),
      req.user.displayName,
    );
    req.user.dnaVector = dnaVector;
    req.user.dnaSummary = dnaSummary;
    req.user.dnaComputedAt = new Date();
    await req.user.save();
    res.json({
      dnaVector,
      dnaSummary,
      dnaComputedAt: req.user.dnaComputedAt,
      chartData: svc.buildChartData(dnaVector),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/recommendations", requireAuth, async (req, res) => {
  const u = req.user;
  if (u.dnaVector.length !== 13)
    return res.status(400).json({ error: "DNA not computed yet" });
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const refresh = req.query.refresh === "true";
  if (!refresh) {
    const cached = await Recommendation.find({ userId: u._id })
      .populate("trackId")
      .sort({ similarityScore: -1 })
      .limit(limit);
    if (cached.length >= limit) return res.json(cached.map(fmtRec));
  }
  try {
    const interacted = await Interaction.find({ userId: u._id }).select(
      "trackId",
    );
    const similar = await svc.findSimilarTracks(u.dnaVector, {
      limit,
      excludeIds: interacted.map((i) => i.trackId),
    });
    if (!similar.length) return res.json([]);
    const whyTexts = await Promise.all(
      similar
        .slice(0, 10)
        .map(({ track, similarityScore }) =>
          svc
            .generateWhyText(track, similarityScore)
            .catch(() => `${Math.round(similarityScore * 100)}% DNA match`),
        ),
    );
    await Recommendation.deleteMany({ userId: u._id });
    await Recommendation.insertMany(
      similar.map((s, i) => ({
        userId: u._id,
        trackId: s.track._id,
        similarityScore: s.similarityScore,
        whyText: whyTexts[i] || "",
      })),
    );
    const populated = await Recommendation.find({ userId: u._id })
      .populate("trackId")
      .sort({ similarityScore: -1 })
      .limit(limit);
    res.json(populated.map(fmtRec));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post(
  "/recommendations/mood",
  requireAuth,
  claudeLimit,
  async (req, res) => {
    const { query } = req.body;
    if (!query?.trim())
      return res.status(400).json({ error: "query is required" });
    const u = req.user;
    if (u.dnaVector.length !== 13)
      return res.status(400).json({ error: "DNA not computed yet" });
    try {
      const featureFilters = await svc.parseMoodQuery(query);
      const interacted = await Interaction.find({ userId: u._id }).select(
        "trackId",
      );
      const similar = await svc.findSimilarTracks(u.dnaVector, {
        limit: 20,
        excludeIds: interacted.map((i) => i.trackId),
        featureFilters,
      });
      if (!similar.length)
        return res.json({
          results: [],
          message: "No tracks matched that mood.",
          parsedFilters: featureFilters,
        });
      const whyTexts = await Promise.all(
        similar
          .slice(0, 10)
          .map(({ track, similarityScore }) =>
            svc.generateWhyText(track, similarityScore).catch(() => ""),
          ),
      );
      await Recommendation.insertMany(
        similar.map((s, i) => ({
          userId: u._id,
          trackId: s.track._id,
          similarityScore: s.similarityScore,
          whyText: whyTexts[i] || "",
          moodQuery: query,
        })),
      );
      const populated = await Recommendation.find({
        userId: u._id,
        moodQuery: query,
      }).populate("trackId");
      res.json({
        results: populated.map(fmtRec),
        parsedFilters: featureFilters,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);
function fmtRec(rec) {
  const t = rec.trackId || rec.track;
  return {
    id: rec._id,
    track: {
      id: t._id,
      spotifyId: t.spotifyId,
      title: t.title,
      artist: t.artist,
      album: t.album,
      albumArt: t.albumArt,
      previewUrl: t.previewUrl,
    },
    similarityScore: rec.similarityScore,
    matchPercent: Math.round(rec.similarityScore * 100),
    whyText: rec.whyText,
    moodQuery: rec.moodQuery,
  };
}
router.get("/tracks/search", requireAuth, async (req, res) => {
  const { q, limit = 20 } = req.query;
  if (!q?.trim()) return res.status(400).json({ error: "q is required" });
  try {
    const client = await svc.getSpotifyClient(req.user);
    const { tracks } = await svc.spotifyGet(client, "/search", {
      q,
      type: "track",
      limit: parseInt(limit),
    });
    const ids = tracks.items.map((t) => t.id);
    svc
      .getAudioFeatures(client, ids)
      .then((afs) => {
        tracks.items.forEach((t, i) => {
          if (afs[i]) svc.upsertTrack(t, afs[i]).catch(() => null);
        });
      })
      .catch(() => null);
    res.json(tracks.items.map(svc.formatTrack));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/tracks/:spotifyId", requireAuth, async (req, res) => {
  const cached = await Track.findOne({ spotifyId: req.params.spotifyId });
  if (cached) return res.json(cached);
  try {
    const client = await svc.getSpotifyClient(req.user);
    const [t, af] = await Promise.all([
      svc.spotifyGet(client, `/tracks/${req.params.spotifyId}`),
      svc.spotifyGet(client, `/audio-features/${req.params.spotifyId}`),
    ]);
    res.json(await svc.upsertTrack(t, af));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/interactions", requireAuth, async (req, res) => {
  const { trackId, action } = req.body;
  if (!trackId || !["liked", "skipped", "saved"].includes(action))
    return res.status(400).json({ error: "trackId and valid action required" });
  const i = await Interaction.findOneAndUpdate(
    { userId: req.user._id, trackId },
    { userId: req.user._id, trackId, action, createdAt: new Date() },
    { upsert: true, new: true },
  );
  res.json({ id: i._id, action: i.action });
});
router.get("/interactions/history", requireAuth, async (req, res) => {
  const { limit = 50, action } = req.query;
  const q = { userId: req.user._id };
  if (action) q.action = action;
  res.json(
    await Interaction.find(q)
      .populate("trackId", "title artist albumArt spotifyId previewUrl")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit)),
  );
});
router.delete("/interactions/:trackId", requireAuth, async (req, res) => {
  await Interaction.findOneAndDelete({
    userId: req.user._id,
    trackId: req.params.trackId,
  });
  res.json({ success: true });
});
router.get("/seeds", requireAuth, async (req, res) => {
  const seeds = await Seed.find({ userId: req.user._id })
    .populate("trackId", "title artist albumArt spotifyId previewUrl")
    .sort({ addedAt: -1 });
  res.json(
    seeds.map((s) => ({ id: s._id, track: s.trackId, addedAt: s.addedAt })),
  );
});
router.post("/seeds", requireAuth, async (req, res) => {
  const { spotifyId } = req.body;
  if (!spotifyId) return res.status(400).json({ error: "spotifyId required" });
  if ((await Seed.countDocuments({ userId: req.user._id })) >= 10)
    return res.status(400).json({ error: "Max 10 seeds" });
  let track = await Track.findOne({ spotifyId });
  if (!track) {
    try {
      const client = await svc.getSpotifyClient(req.user);
      const [t, af] = await Promise.all([
        svc.spotifyGet(client, `/tracks/${spotifyId}`),
        svc.spotifyGet(client, `/audio-features/${spotifyId}`),
      ]);
      track = await svc.upsertTrack(t, af);
    } catch (err) {
      return res.status(502).json({ error: err.message });
    }
  }
  const seed = await Seed.findOneAndUpdate(
    { userId: req.user._id, trackId: track._id },
    { userId: req.user._id, trackId: track._id, addedAt: new Date() },
    { upsert: true, new: true },
  );
  await seed.populate("trackId", "title artist albumArt spotifyId previewUrl");
  res
    .status(201)
    .json({ id: seed._id, track: seed.trackId, addedAt: seed.addedAt });
});
router.delete("/seeds/:trackId", requireAuth, async (req, res) => {
  const result = await Seed.findOneAndDelete({
    userId: req.user._id,
    trackId: req.params.trackId,
  });
  if (!result) return res.status(404).json({ error: "Seed not found" });
  res.json({ success: true });
});
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const upload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "djdou/avatars",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});
router.get("/user/profile", requireAuth, (req, res) => {
  const u = req.user;
  res.json({
    id: u._id,
    spotifyId: u.spotifyId,
    email: u.email,
    displayName: u.displayName,
    avatar: u.avatar,
    hasDNA: u.dnaVector.length === 13,
    dnaSummary: u.dnaSummary,
    dnaComputedAt: u.dnaComputedAt,
    createdAt: u.createdAt,
  });
});
router.post(
  "/user/avatar",
  requireAuth,
  upload.single("avatar"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    req.user.avatar = req.file.path;
    await req.user.save();
    res.json({ avatar: req.file.path });
  },
);
module.exports = router;
