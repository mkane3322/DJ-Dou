const router = require('express').Router();
const { getRecommendations, getMoodRecommendations } = require('../controllers/recommendationsController');
const { requireAuth } = require('../middleware/authMiddleware');
const { claudeLimiter } = require('../middleware/rateLimiter');

router.use(requireAuth);

router.get('/', getRecommendations);
router.post('/mood', claudeLimiter, getMoodRecommendations);

module.exports = router;
