const express = require('express');
const { requireAuth } = require('../auth/middleware');
const { findById, updateHomeLocation } = require('./model');
const router = express.Router();

// GET /api/users/me — return current user profile
// Used by frontend to load auth state and home location on app init
router.get('/me', requireAuth, async (req, res) => {
  // req.user set by requireAuth (full user row from DB)
  const { id, email, home_address, home_lat, home_lon, created_at } = req.user;
  res.json({ id, email, home_address, home_lat, home_lon, created_at });
});

// PUT /api/users/me/home-location — set or update home location (PROF-01, PROF-02)
// Body: { address: string, lat: number, lon: number }
router.put('/me/home-location', requireAuth, async (req, res) => {
  const { address, lat, lon } = req.body;

  // Validate required fields
  if (!address || lat === undefined || lon === undefined) {
    return res.status(400).json({ error: 'address, lat, and lon are required' });
  }

  // Validate coordinate ranges
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  if (isNaN(latNum) || latNum < -90 || latNum > 90) {
    return res.status(400).json({ error: 'lat must be a number between -90 and 90' });
  }
  if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
    return res.status(400).json({ error: 'lon must be a number between -180 and 180' });
  }

  const updated = await updateHomeLocation(req.user.id, address, latNum, lonNum);
  res.json({ id: updated.id, email: updated.email, home_address: updated.home_address, home_lat: updated.home_lat, home_lon: updated.home_lon });
});

module.exports = router;
