'use strict';
const express = require('express');
const passport = require('passport');
const { requireTripOwner } = require('../trips/middleware');
const { getStopsByTripId } = require('../stops/model');
const { getRoute } = require('./service');

const router = express.Router();

// GET /api/trips/:tripId/route
// Returns OSRM route geometry, distance, duration, and legs for a trip's stops
router.get('/:tripId/route',
  passport.authenticate('jwt', { session: false }),
  requireTripOwner,
  async (req, res) => {
    const stops = await getStopsByTripId(req.params.tripId);

    // Filter to stops that have valid coordinates
    const validStops = stops.filter(s => s.address_lat != null && s.address_lon != null);

    if (validStops.length < 2) {
      return res.status(400).json({ error: 'At least 2 stops with coordinates are required for routing' });
    }

    // OSRM coordinate order: [lon, lat]
    const coordinates = validStops.map(s => [parseFloat(s.address_lon), parseFloat(s.address_lat)]);

    try {
      const result = await getRoute(coordinates);
      return res.json({ route: result });
    } catch (err) {
      console.error('OSRM routing error:', err.message);
      return res.status(502).json({ error: 'Routing service unavailable' });
    }
  }
);

module.exports = router;
