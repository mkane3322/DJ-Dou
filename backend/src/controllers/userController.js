const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'djdou/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

/**
 * POST /user/avatar
 * Upload a new avatar image via Cloudinary
 */
async function uploadAvatar(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  req.user.avatar = req.file.path;
  await req.user.save();

  res.json({ avatar: req.file.path });
}

/**
 * GET /user/profile
 * Return full user profile
 */
async function getProfile(req, res) {
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
    createdAt: user.createdAt,
  });
}

module.exports = { upload, uploadAvatar, getProfile };
