const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    spotifyId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    displayName: { type: String },
    avatar: { type: String }, // Cloudinary URL
    spotifyAccessToken: { type: String },
    spotifyRefreshToken: { type: String },
    tokenExpiresAt: { type: Date },

    // The 13-dimension SoundDNA vector
    dnaVector: {
      type: [Number],
      validate: {
        validator: (v) => v.length === 0 || v.length === 13,
        message: 'dnaVector must have exactly 13 dimensions',
      },
      default: [],
    },

    dnaSummary: { type: String, default: '' }, // Claude-generated plain English summary
    dnaComputedAt: { type: Date },
  },
  { timestamps: true }
);

// Has the user's DNA been computed?
userSchema.virtual('hasDNA').get(function () {
  return this.dnaVector.length === 13;
});

module.exports = mongoose.model('User', userSchema);
