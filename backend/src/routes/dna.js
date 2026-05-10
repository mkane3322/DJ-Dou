const router = require('express').Router();
const { getDNAProfile, computeDNA, getChartData } = require('../controllers/dnaController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/profile', getDNAProfile);
router.post('/compute', computeDNA);
router.get('/chart-data', getChartData);

module.exports = router;
