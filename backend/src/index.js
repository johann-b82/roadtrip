require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const passport = require('passport');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true // Required for cookie-based auth
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(passport.initialize());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

module.exports = app;
