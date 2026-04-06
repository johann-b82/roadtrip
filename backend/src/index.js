require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const passport = require('passport');
const { logger, httpLogger } = require('./logging/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Structured request logging — must be first to capture all requests
app.use(httpLogger);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true // Required for cookie-based auth
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(passport.initialize());

// Health check (verifies DB)
app.use('/health', require('./health/routes'));

// Mount routers
app.use('/auth', require('./auth/routes'));
app.use('/api/geocoding', require('./geocoding/routes'));
app.use('/api/users', require('./users/routes'));

// Phase 2: Trip & Stop Management
app.use('/api/trips', require('./trips/routes'));
app.use('/api', require('./stops/routes'));          // stops uses /trips/:tripId/stops and /stops/:id
app.use('/api/unsplash', require('./unsplash/routes'));

// Phase 3: Map Visualization & POI Discovery
app.use('/api/trips', require('./routing/routes'));  // /:tripId/route -> /api/trips/:tripId/route
app.use('/api', require('./pois/routes'));            // /stops/:stopId/pois -> /api/stops/:stopId/pois

// Express 5: async errors propagate automatically
// Add 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Add global error handler
app.use((err, req, res, next) => {
  logger.error({ err, stack: err.stack }, 'Unhandled error');
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Backend running');
});

module.exports = app;
