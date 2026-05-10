require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const dnaRoutes = require('./routes/dna');
const recommendationRoutes = require('./routes/recommendations');
const trackRoutes = require('./routes/tracks');
const interactionRoutes = require('./routes/interactions');
const userRoutes = require('./routes/user');
const seedRoutes = require('./routes/seeds');
const { errorHandler } = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');
const { startCatalogIndexer } = require('./jobs/catalogIndexer');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(globalLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/dna', dnaRoutes);
app.use('/recommendations', recommendationRoutes);
app.use('/tracks', trackRoutes);
app.use('/interactions', interactionRoutes);
app.use('/seeds', seedRoutes);
app.use('/user', userRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Database + Server ────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info('MongoDB connected');
    app.listen(PORT, () => {
      logger.info(`DJ Dou backend running on port ${PORT}`);
      startCatalogIndexer();
    });
  })
  .catch((err) => {
    logger.error('MongoDB connection failed:', err);
    process.exit(1);
  });

module.exports = app;
