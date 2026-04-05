'use strict';
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth/middleware');
const { getOrSearchUnsplash } = require('./model');

// GET /api/unsplash/search?q=description
// Returns top-5 Unsplash images (cached or fresh)
router.get('/search', requireAuth, async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 3) {
    return res.status(400).json({ error: 'Search query must be at least 3 characters' });
  }

  const results = await getOrSearchUnsplash(q.trim());

  // Always respond (fallback=true means use gradient placeholder on frontend)
  res.json({
    urls: results.urls || [],
    metadata: results.metadata || [],
    cached: results.cached || false,
    fallback: results.fallback || false,
  });
});

module.exports = router;
