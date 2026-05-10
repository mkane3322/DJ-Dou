const router = require('express').Router();
const { searchTracks, getTrack } = require('../controllers/tracksController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/search', searchTracks);
router.get('/:spotifyId', getTrack);

module.exports = router;
