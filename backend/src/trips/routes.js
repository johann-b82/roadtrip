'use strict';
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { requireAuth } = require('../auth/middleware');
const { requireTripOwner } = require('./middleware');
const { createTrip, getTripsByUserId, updateTrip, deleteTrip } = require('./model');
const { getStopsByTripId } = require('../stops/model');
const { getOrSearchUnsplash } = require('../unsplash/model');
const { query } = require('../db/connection');

// GET /api/trips/shared/:token — view shared trip (no auth required)
// MUST be registered before /:id to avoid Express matching "shared" as a trip ID
router.get('/shared/:token', async (req, res) => {
  let decoded;
  try {
    decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired share link' });
  }

  const tripResult = await query('SELECT * FROM trips WHERE id = $1', [decoded.trip_id]);
  if (!tripResult.rows[0]) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  const stops = await getStopsByTripId(decoded.trip_id);
  res.json({ trip: tripResult.rows[0], stops, isShared: true });
});

// GET /api/trips — list all trips for authenticated user
router.get('/', requireAuth, async (req, res) => {
  const trips = await getTripsByUserId(req.user.id);
  res.json({ trips });
});

// GET /api/trips/:id — single trip with stops
router.get('/:id', requireAuth, requireTripOwner, async (req, res) => {
  const stops = await getStopsByTripId(req.trip.id);
  res.json({ trip: req.trip, stops });
});

// POST /api/trips — create trip; auto-fetch Unsplash cover photo (D-14)
router.post('/', requireAuth, async (req, res) => {
  const { name, description } = req.body;
  if (!name || name.trim().length < 1) {
    return res.status(400).json({ error: 'Trip name is required' });
  }

  // Fetch Unsplash photos using description + "travel" (D-14)
  let coverPhotoUrl = null;
  let coverPhotoSource = 'fallback';
  let photoUrls = [];
  let photoMetadata = [];

  if (description && description.trim().length >= 3) {
    const searchQuery = `${description.trim()} travel`;
    const photos = await getOrSearchUnsplash(searchQuery);
    if (!photos.fallback && photos.urls.length > 0) {
      coverPhotoUrl = photos.urls[0]; // Default to first image
      coverPhotoSource = 'unsplash';
      photoUrls = photos.urls;
      photoMetadata = photos.metadata;
    }
  }

  const trip = await createTrip({
    userId: req.user.id,
    name: name.trim(),
    description: description ? description.trim() : null,
    coverPhotoUrl,
    coverPhotoSource,
    selectedPhotoIndex: 0,
  });

  res.status(201).json({ trip, photoUrls, photoMetadata });
});

// PUT /api/trips/:id — update trip name, description, or selected photo
router.put('/:id', requireAuth, requireTripOwner, async (req, res) => {
  const { name, description, selectedPhotoIndex } = req.body;

  // If description changed, re-fetch Unsplash photos (D-14)
  let coverPhotoUrl = req.trip.cover_photo_url;
  let coverPhotoSource = req.trip.cover_photo_source;

  if (description !== undefined && description !== req.trip.description) {
    if (description && description.trim().length >= 3) {
      const searchQuery = `${description.trim()} travel`;
      const photos = await getOrSearchUnsplash(searchQuery);
      if (!photos.fallback && photos.urls.length > 0) {
        const idx = selectedPhotoIndex !== undefined ? selectedPhotoIndex : 0;
        coverPhotoUrl = photos.urls[idx] || photos.urls[0];
        coverPhotoSource = 'unsplash';
      }
    }
  }

  const updated = await updateTrip(req.trip.id, req.user.id, {
    name,
    description,
    coverPhotoUrl,
    coverPhotoSource,
    selectedPhotoIndex,
  });

  res.json({ trip: updated });
});

// DELETE /api/trips/:id — delete trip and cascade stops
router.delete('/:id', requireAuth, requireTripOwner, async (req, res) => {
  await deleteTrip(req.trip.id, req.user.id);
  res.json({ deleted: true, tripId: req.trip.id });
});

// POST /api/trips/:tripId/share — generate read-only share link (auth required)
router.post('/:tripId/share', requireAuth, requireTripOwner, async (req, res) => {
  const { tripId } = req.params;
  const expiresIn = '7d'; // Share links valid for 7 days

  const token = jwt.sign(
    { trip_id: tripId, shared_at: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn }
  );

  const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost'}/trips/shared/${token}`;
  res.json({ shareUrl, expiresIn });
});

module.exports = router;
