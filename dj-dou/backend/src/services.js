const axios = require("axios");
const Anthropic = require("@anthropic-ai/sdk");
const { Track, FEATURE_ORDER } = require("./models");
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const FEATURE_RANGES = {
  danceability: { min: 0, max: 1 },
  energy: { min: 0, max: 1 },
  key: { min: 0, max: 11 },
  loudness: { min: -60, max: 0 },
  mode: { min: 0, max: 1 },
  speechiness: { min: 0, max: 1 },
  acousticness: { min: 0, max: 1 },
  instrumentalness: { min: 0, max: 1 },
  liveness: { min: 0, max: 1 },
  valence: { min: 0, max: 1 },
  tempo: { min: 50, max: 220 },
  duration_ms: { min: 30000, max: 600000 },
  time_signature: { min: 1, max: 7 },
};
function normalizeFeatures(af) {
  const out = {};
  for (const f of FEATURE_ORDER) {
    const { min, max } = FEATURE_RANGES[f];
    out[f] = (Math.max(min, Math.min(max, af[f] ?? 0)) - min) / (max - min);
  }
  return out;
}
function audioFeaturesToVector(af) {
  return FEATURE_ORDER.map((f) => {
    const { min, max } = FEATURE_RANGES[f];
    return (Math.max(min, Math.min(max, af[f] ?? 0)) - min) / (max - min);
  });
}
function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0,
    magA = 0,
    magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}
const SCOPES = [
  "user-read-email",
  "user-read-private",
  "user-top-read",
  "user-read-recently-played",
  "playlist-read-private",
].join(" ");
function getAuthUrl() {
  const p = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: SCOPES,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
  });
  return `https://accounts.spotify.com/authorize?${p}`;
}
async function spotifyTokenRequest(params) {
  const creds = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");
  const { data } = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams(params),
    {
      headers: {
        Authorization: `Basic ${creds}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  return data;
}
async function exchangeCode(code) {
  return spotifyTokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
  });
}
async function getSpotifyClient(user) {
  let token = user.spotifyAccessToken;
  if (user.tokenExpiresAt && new Date() >= user.tokenExpiresAt) {
    const r = await spotifyTokenRequest({
      grant_type: "refresh_token",
      refresh_token: user.spotifyRefreshToken,
    });
    token = r.access_token;
    user.spotifyAccessToken = token;
    user.tokenExpiresAt = new Date(Date.now() + r.expires_in * 1000);
    await user.save();
  }
  return axios.create({
    baseURL: "https://api.spotify.com/v1",
    headers: { Authorization: `Bearer ${token}` },
  });
}
async function spotifyGet(client, path, params = {}) {
  const { data } = await client.get(path, { params });
  return data;
}
async function getAudioFeatures(client, ids) {
  if (!ids.length) return [];
  const results = [];
  for (let i = 0; i < ids.length; i += 100) {
    const d = await spotifyGet(client, "/audio-features", {
      ids: ids.slice(i, i + 100).join(","),
    });
    results.push(...(d.audio_features || []));
  }
  return results.filter(Boolean);
}
function formatTrack(t) {
  return {
    spotifyId: t.id,
    title: t.name,
    artist: t.artists?.map((a) => a.name).join(", ") || "",
    album: t.album?.name || "",
    albumArt: t.album?.images?.[0]?.url || "",
    previewUrl: t.preview_url || null,
    popularity: t.popularity || 0,
  };
}
async function computeDNAVector(user, client) {
  const [short, medium, long] = await Promise.all([
    spotifyGet(client, "/me/top/tracks", {
      time_range: "short_term",
      limit: 50,
    }),
    spotifyGet(client, "/me/top/tracks", {
      time_range: "medium_term",
      limit: 50,
    }),
    spotifyGet(client, "/me/top/tracks", {
      time_range: "long_term",
      limit: 50,
    }),
  ]);
  const map = new Map();
  for (const { items, w } of [
    { items: short.items, w: 3 },
    { items: medium.items, w: 2 },
    { items: long.items, w: 1 },
  ]) {
    for (const t of items) {
      if (!map.has(t.id) || map.get(t.id).w < w) map.set(t.id, { t, w });
    }
  }
  const unique = Array.from(map.values());
  let afs = [];
  try {
    afs = await getAudioFeatures(
      client,
      unique.map(({ t }) => t.id),
    );
  } catch (err) {
    console.warn(
      "Audio features blocked by Spotify (403) — using neutral DNA vector",
    );
    return new Array(13).fill(0.5);
  }
  const validAfs = afs.filter(Boolean);
  if (!validAfs.length) {
    console.warn("No audio features returned — using neutral DNA vector");
    return new Array(13).fill(0.5);
  }
  const totalW = unique.reduce((s, { w }) => s + w, 0);
  const sums = new Array(13).fill(0);
  afs.forEach((af, i) => {
    if (!af) return;
    const vec = audioFeaturesToVector(af);
    const w = unique[i]?.w || 1;
    vec.forEach((v, j) => {
      sums[j] += v * w;
    });
  });
  return sums.map((s) => s / totalW);
}
function interpretDNA(vec) {
  const [
    dance,
    energy,
    ,
    ,
    ,
    speech,
    acoustic,
    instrumental,
    live,
    valence,
    tempo,
  ] = vec;
  return {
    danceability:
      dance > 0.6
        ? "highly danceable"
        : dance > 0.4
          ? "moderately danceable"
          : "not very danceable",
    energy:
      energy > 0.6
        ? "high energy"
        : energy > 0.4
          ? "moderate energy"
          : "calm / low energy",
    valence:
      valence > 0.6
        ? "happy and positive"
        : valence > 0.4
          ? "mixed tone"
          : "melancholic or dark",
    tempo: tempo > 0.6 ? "fast-paced" : tempo > 0.4 ? "mid-tempo" : "slow",
    acousticness:
      acoustic > 0.6
        ? "very acoustic"
        : acoustic > 0.4
          ? "somewhat acoustic"
          : "electronic/produced",
    instrumentalness:
      instrumental > 0.5 ? "mostly instrumental" : "vocal-forward",
    speechiness: speech > 0.5 ? "rap/spoken word" : "sung vocals",
    liveness: live > 0.7 ? "live recordings" : "studio recordings",
  };
}
async function findSimilarTracks(
  dnaVector,
  { limit = 20, excludeIds = [], featureFilters = {} } = {},
) {
  const query = {};
  const tracksWithVectors = await Track.countDocuments({
    featureVector: { $exists: true, $not: { $size: 0 } },
  });
  if (tracksWithVectors > 0) {
    query.featureVector = { $exists: true, $not: { $size: 0 } };
  }
  if (excludeIds.length) query._id = { $nin: excludeIds };
  for (const [f, [mn, mx]] of Object.entries(featureFilters)) {
    query[`audioFeatures.${f}`] = { $gte: mn, $lte: mx };
  }
  const candidates = await Track.find(query).limit(10000).lean();
  if (!candidates.length) return [];
  if (tracksWithVectors > 0) {
    return candidates
      .map((t) => ({
        track: t,
        similarityScore: cosineSimilarity(dnaVector, t.featureVector),
      }))
      .filter(
        ({ similarityScore }) => !isNaN(similarityScore) && similarityScore > 0,
      )
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
  } else {
    return candidates
      .sort(() => Math.random() - 0.5)
      .slice(0, limit)
      .map((track) => ({ track, similarityScore: 0.5 }));
  }
}
function buildChartData(vec) {
  return [
    { axis: "Danceability", value: vec[0] },
    { axis: "Energy", value: vec[1] },
    { axis: "Positivity", value: vec[9] },
    { axis: "Acoustic", value: vec[6] },
    { axis: "Tempo", value: vec[10] },
    { axis: "Instrumental", value: vec[7] },
    { axis: "Speechiness", value: vec[5] },
    { axis: "Liveness", value: vec[8] },
  ];
}
async function claudeMessage(prompt, maxTokens = 300) {
  const msg = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  return msg.content[0].text.trim();
}
async function generateDNASummary(interpretation, displayName) {
  const traits = Object.entries(interpretation)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  return claudeMessage(
    `You are DJ Dou, a music personality analyst. Based on the audio DNA below, write a 2–3 sentence description of ${displayName || "this listener"}'s musical identity. Make it personal and poetic — like a horoscope for music taste. Don't list stats; synthesize them into a vivid portrait.\n\nAudio DNA:\n${traits}\n\nWrite only the description, nothing else.`,
    300,
  );
}
async function generateWhyText(track, score) {
  return claudeMessage(
    `Write one punchy sentence (max 20 words) explaining why a user would love "${track.title}" by ${track.artist}. It's a ${Math.round(score * 100)}% DNA match. Be specific about vibe or emotion.`,
    80,
  );
}
async function parseMoodQuery(query) {
  const raw = await claudeMessage(
    `Convert this mood into Spotify audio feature ranges. Respond ONLY with valid JSON — no preamble, no backticks.\nFeatures (all 0–1): danceability, energy, valence, tempo, acousticness, instrumentalness, speechiness\nEach key maps to [min, max].\n\nMood: "${query}"\n\nExample: {"valence":[0,0.3],"energy":[0,0.4]}`,
    150,
  );
  try {
    const parsed = JSON.parse(raw);
    const valid = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (Array.isArray(v) && v.length === 2 && typeof v[0] === "number") {
        valid[k] = [Math.max(0, v[0]), Math.min(1, v[1])];
      }
    }
    return valid;
  } catch {
    return {};
  }
}
async function upsertTrack(spotifyTrack, audioFeatures) {
  const formatted = formatTrack(spotifyTrack);
  return Track.findOneAndUpdate(
    { spotifyId: formatted.spotifyId },
    {
      ...formatted,
      audioFeatures: {
        danceability: audioFeatures.danceability,
        energy: audioFeatures.energy,
        key: audioFeatures.key,
        loudness: audioFeatures.loudness,
        mode: audioFeatures.mode,
        speechiness: audioFeatures.speechiness,
        acousticness: audioFeatures.acousticness,
        instrumentalness: audioFeatures.instrumentalness,
        liveness: audioFeatures.liveness,
        valence: audioFeatures.valence,
        tempo: audioFeatures.tempo,
        duration_ms: audioFeatures.duration_ms,
        time_signature: audioFeatures.time_signature,
      },
      featureVector: audioFeaturesToVector(audioFeatures),
      cachedAt: new Date(),
    },
    { upsert: true, new: true },
  );
}
module.exports = {
  getAuthUrl,
  exchangeCode,
  getSpotifyClient,
  spotifyGet,
  getAudioFeatures,
  formatTrack,
  computeDNAVector,
  interpretDNA,
  findSimilarTracks,
  buildChartData,
  generateDNASummary,
  generateWhyText,
  parseMoodQuery,
  upsertTrack,
  cosineSimilarity,
};
