const router = require("express").Router();
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const axios = require("axios");
const { User, Track, Interaction, Recommendation } = require("./models");
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
    console.error("Auth error:", err.message);
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
    const client = await svc.getClient(req.user);
    const { dnaVector, dnaSummary, hasAudioFeatures } = await svc.computeDNA(
      req.user,
      client,
    );
    req.user.dnaVector = dnaVector;
    req.user.dnaSummary = dnaSummary;
    req.user.dnaComputedAt = new Date();
    await req.user.save();
    console.log(
      `[dna] Computed for ${req.user.displayName} (audioFeatures: ${hasAudioFeatures})`,
    );
    res.json({
      dnaVector,
      dnaSummary,
      dnaComputedAt: req.user.dnaComputedAt,
      chartData: svc.buildChartData(dnaVector),
      hasAudioFeatures,
    });
  } catch (err) {
    console.error("[dna] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
router.get("/recommendations", requireAuth, async (req, res) => {
  const u = req.user;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  if (u.dnaVector.length !== 13)
    return res.status(400).json({ error: "DNA not computed yet" });
  if (req.query.refresh !== "true") {
    try {
      const cached = await Recommendation.find({ userId: u._id })
        .populate("trackId")
        .sort({ similarityScore: -1 })
        .limit(limit);
      const valid = cached.filter((r) => r.trackId != null);
      if (valid.length >= limit) return res.json(valid.map(fmtRec));
    } catch {
      /* fall through to fresh computation */
    }
  }
  try {
    const interacted = await Interaction.find({ userId: u._id }).select(
      "trackId",
    );
    const similar = await svc.findSimilar(u.dnaVector, {
      limit,
      excludeIds: interacted.map((i) => i.trackId),
    });
    if (!similar.length) return res.json([]);
    await Recommendation.deleteMany({ userId: u._id });
    await Recommendation.insertMany(
      similar
        .filter((s) => s.track?._id)
        .map((s) => ({
          userId: u._id,
          trackId: s.track._id,
          similarityScore: s.score,
        })),
    );
    const populated = await Recommendation.find({ userId: u._id })
      .populate("trackId")
      .sort({ similarityScore: -1 })
      .limit(limit);

    res.json(populated.filter((r) => r.trackId != null).map(fmtRec));
  } catch (err) {
    console.error("[recs] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
function fmtRec(rec) {
  const t = rec.trackId;
  if (!t) return null;
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
  };
}
router.get("/tracks/search", requireAuth, async (req, res) => {
  const { q, limit = 20 } = req.query;
  if (!q?.trim()) return res.status(400).json({ error: "q is required" });
  try {
    const client = await svc.getClient(req.user);
    const { tracks } = await svc.spotifyGet(client, "/search", {
      q,
      type: "track",
      limit: parseInt(limit),
    });
    tracks.items.forEach((t) => {
      const f = svc.formatTrack(t);
      Track.findOneAndUpdate(
        { spotifyId: f.spotifyId },
        { ...f, cachedAt: new Date() },
        { upsert: true },
      ).catch(() => null);
    });

    res.json(tracks.items.map(svc.formatTrack));
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
module.exports = router;
