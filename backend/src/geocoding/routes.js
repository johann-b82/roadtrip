const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET /api/geocoding/search?q=address
// Proxies to Nominatim — adds required User-Agent header, limits results to 5
// Open endpoint (no requireAuth) — needed on onboarding before full session established
router.get('/search', async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 3) {
    return res.status(400).json({ error: 'Query must be at least 3 characters' });
  }

  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: q.trim(),
        format: 'json',
        limit: 5,
        addressdetails: 1,
      },
      headers: {
        // OSM Nominatim usage policy requires identifying User-Agent
        'User-Agent': 'RoadTripPlanner/1.0 (contact@roadtrip.app)',
        'Accept-Language': 'en',
      },
      timeout: 5000,
    });

    // Return normalized results: only fields the frontend needs
    const results = response.data.map((item) => ({
      osm_id: item.osm_id,
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type,
      address: item.address,
    }));

    res.json(results);
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Geocoding service timeout' });
    }
    console.error('Nominatim error:', err.message);
    res.status(502).json({ error: 'Geocoding service unavailable' });
  }
});

module.exports = router;
