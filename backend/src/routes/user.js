const router = require('express').Router();
const { upload, uploadAvatar, getProfile } = require('../controllers/userController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/profile', getProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);

module.exports = router;
