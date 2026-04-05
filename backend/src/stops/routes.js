'use strict';
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth/middleware');
const { requireTripOwner } = require('../trips/middleware');
const { requireStopOwner } = require('./middleware');
const { createStop, getStopsByTripId, updateStop, deleteStop, reorderStops } = require('./model');

// POST /api/trips/:tripId/stops — add stop to trip
router.post('/trips/:tripId/stops', requireAuth, requireTripOwner, async (req, res) => {
  const { address, addressLat, addressLon, description, startDate, endDate } = req.body;
  if (!address || address.trim().length < 1) {
    return res.status(400).json({ error: 'Stop address is required' });
  }
  const stop = await createStop(req.trip.id, {
    address: address.trim(),
    addressLat: addressLat ? parseFloat(addressLat) : null,
    addressLon: addressLon ? parseFloat(addressLon) : null,
    description: description || null,
    startDate: startDate || null,
    endDate: endDate || null,
  });
  res.status(201).json({ stop });
});

// GET /api/trips/:tripId/stops — list stops for a trip
router.get('/trips/:tripId/stops', requireAuth, requireTripOwner, async (req, res) => {
  const stops = await getStopsByTripId(req.trip.id);
  res.json({ stops });
});

// PUT /api/trips/:tripId/stops/reorder — reorder stops via drag-and-drop (D-11, STOP-05)
router.put('/trips/:tripId/stops/reorder', requireAuth, requireTripOwner, async (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return res.status(400).json({ error: 'orderedIds must be a non-empty array' });
  }
  await reorderStops(req.trip.id, orderedIds);
  const stops = await getStopsByTripId(req.trip.id);
  res.json({ stops });
});

// PUT /api/stops/:id — update a stop (STOP-06)
router.put('/stops/:id', requireAuth, requireStopOwner, async (req, res) => {
  const { address, addressLat, addressLon, description, startDate, endDate } = req.body;
  const updated = await updateStop(req.stop.id, req.stop.trip_id, {
    address: address ? address.trim() : undefined,
    addressLat: addressLat ? parseFloat(addressLat) : undefined,
    addressLon: addressLon ? parseFloat(addressLon) : undefined,
    description,
    startDate,
    endDate,
  });
  res.json({ stop: updated });
});

// DELETE /api/stops/:id — delete a stop (STOP-07)
router.delete('/stops/:id', requireAuth, requireStopOwner, async (req, res) => {
  await deleteStop(req.stop.id, req.stop.trip_id);
  res.json({ deleted: true, stopId: req.stop.id });
});

module.exports = router;
