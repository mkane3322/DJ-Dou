const mongoose = require('mongoose');

// The 13 Spotify audio features we store and index
const AUDIO_FEATURE_KEYS = [
  'danceability',
  'energy',
  'key',
  'loudness',
  'mode',
  'speechiness',
  'acousticness',
  'instrumentalness',
  'liveness',
  'valence',
  'tempo',
  'duration_ms',
  'time_signature',
];

const trackSchema = new mongoose.Schema(
  {
    spotifyId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    artist: { type: String, required: true },
    album: { type: String },
    albumArt: { type: String }, // Spotify album art URL
    previewUrl: { type: String }, // 30-second preview URL

    // Raw Spotify audio features object
    audioFeatures: {
      danceability: Number,
      energy: Number,
      key: Number,
      loudness: Number,
      mode: Number,
      speechiness: Number,
      acousticness: Number,
      instrumentalness: Number,
      liveness: Number,
      valence: Number,
      tempo: Number,
      duration_ms: Number,
      time_signature: Number,
    },

    // Normalized [0,1] vector for cosine similarity — same order as AUDIO_FEATURE_KEYS
    featureVector: {
      type: [Number],
      validate: {
        validator: (v) => v.length === 0 || v.length === 13,
        message: 'featureVector must have exactly 13 dimensions',
      },
      default: [],
    },

    cachedAt: { type: Date, default: Date.now },
    popularity: { type: Number, default: 0 },
    genres: [String],
  },
  { timestamps: true }
);

// Index for efficient catalog queries
trackSchema.index({ artist: 1 });
trackSchema.index({ cachedAt: 1 });
trackSchema.index({ popularity: -1 });

trackSchema.statics.AUDIO_FEATURE_KEYS = AUDIO_FEATURE_KEYS;

module.exports = mongoose.model('Track', trackSchema);
