const axios = require("axios");
const { Track, FEATURE_ORDER } = require("./models");
const RANGES = {
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
function toVector(af) {
  return FEATURE_ORDER.map((f) => {
    const { min, max } = RANGES[f];
    return (Math.max(min, Math.min(max, af[f] ?? 0)) - min) / (max - min);
  });
}
function cosine(a, b) {
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
function buildDNASummary(vec) {
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

  const mood =
    valence > 0.6
      ? "uplifting and positive"
      : valence > 0.4
        ? "emotionally balanced"
        : "introspective and moody";
  const drive =
    energy > 0.6
      ? "high-energy"
      : energy > 0.4
        ? "mid-energy"
        : "calm and relaxed";
  const groove =
    dance > 0.6
      ? "highly danceable"
      : dance > 0.4
        ? "rhythmically engaging"
        : "laid-back";
  const sound =
    acoustic > 0.6
      ? "acoustic and organic"
      : acoustic > 0.3
        ? "a blend of acoustic and electronic"
        : "electronic and produced";
  const vocals =
    instrumental > 0.6
      ? "instrumental"
      : speech > 0.5
        ? "rap and spoken word"
        : "vocal-forward";
  const pace = tempo > 0.6 ? "fast-paced" : tempo > 0.4 ? "mid-tempo" : "slow";
  const setting = live > 0.7 ? "with a live concert energy" : "studio-polished";

  return `Your SoundDNA leans ${mood}, ${drive}, and ${groove}. You gravitate toward ${sound} tracks that are ${vocals} and ${pace} ${setting}.`;
}
const SCOPES = [
  "user-read-email",
  "user-read-private",
  "user-top-read",
  "user-read-recently-played",
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
async function getClient(user) {
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
async function computeDNA(user, client) {
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
  const ids = unique.map(({ t }) => t.id);
  let featureMap = new Map();
  try {
    const chunks = [];
    for (let i = 0; i < ids.length; i += 100)
      chunks.push(ids.slice(i, i + 100));
    for (const chunk of chunks) {
      const { audio_features } = await spotifyGet(client, "/audio-features", {
        ids: chunk.join(","),
      });
      (audio_features || [])
        .filter(Boolean)
        .forEach((af) => featureMap.set(af.id, af));
    }
    console.log(`[dna] Got audio features for ${featureMap.size} tracks`);
  } catch (err) {
    console.warn(
      "[dna] Audio features blocked — falling back to genre/popularity model",
    );
  }
  if (featureMap.size > 0) {
    const totalW = unique.reduce((s, { w }) => s + w, 0);
    const sums = new Array(13).fill(0);
    unique.forEach(({ t, w }) => {
      const af = featureMap.get(t.id);
      if (!af) return;
      toVector(af).forEach((v, j) => {
        sums[j] += v * w;
      });
    });
    const vec = sums.map((s) => s / totalW);
    return {
      dnaVector: vec,
      dnaSummary: buildDNASummary(vec),
      hasAudioFeatures: true,
    };
  }
  const totalW = unique.reduce((s, { w }) => s + w, 0);
  const sums = new Array(13).fill(0);
  unique.forEach(({ t, w }) => {
    const pop = (t.popularity || 50) / 100;
    const dur = Math.min(
      1,
      Math.max(0, ((t.duration_ms || 210000) - 30000) / 570000),
    );
    const rough = [
      pop * 0.8, // danceability ≈ popular songs tend to be danceable
      pop * 0.7 + 0.15, // energy
      0.5, // key (unknown)
      0.6, // loudness
      0.6, // mode (assume major)
      0.1, // speechiness
      0.3, // acousticness
      0.05, // instrumentalness
      0.15, // liveness
      pop * 0.6 + 0.2, // valence ≈ popular songs tend positive
      0.55, // tempo
      dur, // duration
      0.57, // time_signature (4/4)
    ];
    rough.forEach((v, j) => {
      sums[j] += v * w;
    });
  });
  const vec = sums.map((s) => s / totalW);
  return {
    dnaVector: vec,
    dnaSummary: buildDNASummary(vec),
    hasAudioFeatures: false,
  };
}
async function findSimilar(dnaVector, { limit = 20, excludeIds = [] } = {}) {
  const query = {};
  if (excludeIds.length) query._id = { $nin: excludeIds };
  const hasVectors = await Track.countDocuments({
    featureVector: { $exists: true, $not: { $size: 0 } },
  });
  if (hasVectors > 0) {
    query.featureVector = { $exists: true, $not: { $size: 0 } };
  }
  const candidates = await Track.find(query).limit(10000).lean();
  if (!candidates.length) return [];
  if (hasVectors > 0) {
    return candidates
      .map((t) => ({ track: t, score: cosine(dnaVector, t.featureVector) }))
      .filter(({ score }) => score > 0 && !isNaN(score))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  return candidates
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, limit)
    .map((track) => ({ track, score: 0.5 }));
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
async function upsertTrack(spotifyTrack, audioFeatures) {
  const formatted = formatTrack(spotifyTrack);
  const update = { ...formatted, cachedAt: new Date() };
  if (audioFeatures) {
    update.audioFeatures = {
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
    };
    update.featureVector = toVector(audioFeatures);
  }
  return Track.findOneAndUpdate({ spotifyId: formatted.spotifyId }, update, {
    upsert: true,
    new: true,
  });
}
module.exports = {
  getAuthUrl,
  exchangeCode,
  getClient,
  spotifyGet,
  formatTrack,
  computeDNA,
  findSimilar,
  buildChartData,
  upsertTrack,
  toVector,
  cosine,
};
