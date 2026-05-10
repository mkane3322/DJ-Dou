const jwt = require('jsonwebtoken');
const User = require('../models/User');
const spotifyService = require('../services/spotifyService');
const logger = require('../utils/logger');

/**
 * GET /auth/spotify
 * Redirect user to Spotify OAuth consent screen
 */
function initiateSpotifyAuth(req, res) {
  const url = spotifyService.getAuthUrl();
  res.redirect(url);
}

/**
 * GET /auth/spotify/callback
 * Handle Spotify redirect, exchange code, upsert user, issue JWT
 */
async function spotifyCallback(req, res) {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=spotify_denied`);
  }

  try {
    // Exchange code for tokens
    const tokens = await spotifyService.exchangeCode(code);
    const { access_token, refresh_token, expires_in } = tokens;

    // Create a temporary client to get profile
    const tempClient = require('axios').create({
      baseURL: 'https://api.spotify.com/v1',
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profile = await spotifyService.getProfile(tempClient);

    // Upsert user in MongoDB
    const user = await User.findOneAndUpdate(
      { spotifyId: profile.id },
      {
        spotifyId: profile.id,
        email: profile.email,
        displayName: profile.display_name,
        avatar: profile.images?.[0]?.url || '',
        spotifyAccessToken: access_token,
        spotifyRefreshToken: refresh_token,
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Issue JWT
    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    logger.info(`User authenticated: ${user.spotifyId}`);

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${jwtToken}`);
  } catch (err) {
    logger.error('Spotify callback error:', err.message);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
}

/**
 * GET /auth/me
 * Return current authenticated user
 */
async function getMe(req, res) {
  const user = req.user;
  res.json({
    id: user._id,
    spotifyId: user.spotifyId,
    email: user.email,
    displayName: user.displayName,
    avatar: user.avatar,
    hasDNA: user.dnaVector.length === 13,
    dnaSummary: user.dnaSummary,
    dnaComputedAt: user.dnaComputedAt,
  });
}

module.exports = { initiateSpotifyAuth, spotifyCallback, getMe };
