'use strict';
const express = require('express');
const passport = require('passport');
const { getCachedPOIs, cachePOIs } = require('./model');
const { queryPOIs, searchPOIs, POI_CATEGORIES } = require('./service');
const { query } = require('../db/connection');

const router = express.Router();

// Helper: verify the authenticated user owns the given stop
async function verifyStopOwnership(stopId, userId) {
  const result = await query(
    `SELECT s.* FROM stops s
     JOIN trips t ON t.id = s.trip_id
     WHERE s.id = $1 AND t.user_id = $2`,
    [stopId, userId]
  );
  return result.rows[0] || null;
}

// GET /api/pois/categories — no auth required
// Returns list of available POI category search terms
router.get('/pois/categories', (req, res) => {
  return res.json({ categories: POI_CATEGORIES });
});

// GET /api/stops/:stopId/pois
// Returns POIs for a stop (cache-first: PostgreSQL cache valid for 24h)
router.get('/stops/:stopId/pois',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const { stopId } = req.params;

    // Verify ownership
    const stop = await verifyStopOwnership(stopId, req.user.id);
    if (!stop) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    // Cache-first: return cached POIs if still fresh
    const cached = await getCachedPOIs(stopId);
    if (cached.length > 0) {
      return res.json({ pois: cached });
    }

    // Check stop has coordinates
    if (stop.address_lat == null || stop.address_lon == null) {
      return res.status(400).json({ error: 'Stop has no coordinates for POI search' });
    }

    // Fetch from Overpass and cache
    const pois = await queryPOIs(stop.address_lat, stop.address_lon);
    await cachePOIs(stopId, pois);

    return res.json({ pois });
  }
);

// GET /api/stops/:stopId/pois/search?q=restaurants
// Ad-hoc POI search by category/term (not cached)
router.get('/stops/:stopId/pois/search',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const { stopId } = req.params;
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query "q" is required' });
    }

    // Verify ownership
    const stop = await verifyStopOwnership(stopId, req.user.id);
    if (!stop) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    // Check stop has coordinates
    if (stop.address_lat == null || stop.address_lon == null) {
      return res.status(400).json({ error: 'Stop has no coordinates for POI search' });
    }

    const pois = await searchPOIs(stop.address_lat, stop.address_lon, q.trim());
    return res.json({ pois, query: q.trim() });
  }
);

module.exports = router;
