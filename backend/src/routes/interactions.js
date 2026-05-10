const router = require('express').Router();
const { logInteraction, getHistory, removeInteraction } = require('../controllers/interactionsController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.post('/', logInteraction);
router.get('/history', getHistory);
router.delete('/:trackId', removeInteraction);

module.exports = router;
