const mongoose = require('mongoose');

// ─── Seed ─────────────────────────────────────────────────────────────────────
// Tracks the user has explicitly chosen as "seed" songs for DNA computation
const seedSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);
seedSchema.index({ userId: 1, trackId: 1 }, { unique: true });

// ─── Interaction ──────────────────────────────────────────────────────────────
// Tracks user actions on recommended songs (for future reinforcement learning)
const interactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true },
    action: {
      type: String,
      enum: ['liked', 'skipped', 'saved'],
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);
interactionSchema.index({ userId: 1, createdAt: -1 });

// ─── Recommendation ───────────────────────────────────────────────────────────
// Cached recommendations with Claude-generated explanations
const recommendationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true },
    similarityScore: { type: Number, required: true, min: 0, max: 1 },
    // Claude-generated "why you'll love this" text
    whyText: { type: String, default: '' },
    moodQuery: { type: String, default: '' }, // If generated from a mood search
    createdAt: { type: Date, default: Date.now, expires: 86400 }, // TTL: 24 hours
  },
  { timestamps: false }
);
recommendationSchema.index({ userId: 1, similarityScore: -1 });

module.exports = {
  Seed: mongoose.model('Seed', seedSchema),
  Interaction: mongoose.model('Interaction', interactionSchema),
  Recommendation: mongoose.model('Recommendation', recommendationSchema),
};
