const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  spotifyId:           { type: String, required: true, unique: true, index: true },
  email:               { type: String, required: true },
  displayName:         String,
  avatar:              String,
  spotifyAccessToken:  String,
  spotifyRefreshToken: String,
  tokenExpiresAt:      Date,
  dnaVector:           { type: [Number], default: [] },
  dnaSummary:          { type: String, default: '' },
  dnaComputedAt:       Date,
}, { timestamps: true });

const trackSchema = new Schema({
  spotifyId:    { type: String, required: true, unique: true, index: true },
  title:        { type: String, required: true },
  artist:       { type: String, required: true },
  album:        String,
  albumArt:     String,
  previewUrl:   String,
  popularity:   { type: Number, default: 0 },
  audioFeatures: {
    danceability: Number, energy: Number, key: Number, loudness: Number,
    mode: Number, speechiness: Number, acousticness: Number,
    instrumentalness: Number, liveness: Number, valence: Number,
    tempo: Number, duration_ms: Number, time_signature: Number,
  },
  featureVector: { type: [Number], default: [] },
  cachedAt:      { type: Date, default: Date.now },
}, { timestamps: true });

trackSchema.index({ popularity: -1 });

const seedSchema = new Schema({
  userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  trackId: { type: Schema.Types.ObjectId, ref: 'Track', required: true },
  addedAt: { type: Date, default: Date.now },
});
seedSchema.index({ userId: 1, trackId: 1 }, { unique: true });

const interactionSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  trackId:   { type: Schema.Types.ObjectId, ref: 'Track', required: true },
  action:    { type: String, enum: ['liked', 'skipped', 'saved'], required: true },
  createdAt: { type: Date, default: Date.now },
});
interactionSchema.index({ userId: 1, createdAt: -1 });

const recommendationSchema = new Schema({
  userId:          { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  trackId:         { type: Schema.Types.ObjectId, ref: 'Track', required: true },
  similarityScore: { type: Number, required: true },
  whyText:         { type: String, default: '' },
  moodQuery:       { type: String, default: '' },
  createdAt:       { type: Date, default: Date.now, expires: 86400 },
});
recommendationSchema.index({ userId: 1, similarityScore: -1 });

const FEATURE_ORDER = [
  'danceability', 'energy', 'key', 'loudness', 'mode', 'speechiness',
  'acousticness', 'instrumentalness', 'liveness', 'valence',
  'tempo', 'duration_ms', 'time_signature',
];

module.exports = {
  User:           mongoose.model('User', userSchema),
  Track:          mongoose.model('Track', trackSchema),
  Seed:           mongoose.model('Seed', seedSchema),
  Interaction:    mongoose.model('Interaction', interactionSchema),
  Recommendation: mongoose.model('Recommendation', recommendationSchema),
  FEATURE_ORDER,
};
