const router = require('express').Router();
const { getSeeds, addSeed, removeSeed } = require('../controllers/seedsController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/', getSeeds);
router.post('/', addSeed);
router.delete('/:trackId', removeSeed);

module.exports = router;
