const router = require('express').Router();
const { initiateSpotifyAuth, spotifyCallback, getMe } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

router.get('/spotify', authLimiter, initiateSpotifyAuth);
router.get('/spotify/callback', spotifyCallback);
router.get('/me', requireAuth, getMe);

module.exports = router;
