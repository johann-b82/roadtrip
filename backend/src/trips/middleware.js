'use strict';
const { getTripById } = require('./model');

// Verifies the authenticated user owns the trip; attaches trip to req.trip
async function requireTripOwner(req, res, next) {
  const tripId = req.params.tripId || req.params.id;
  const trip = await getTripById(tripId, req.user.id);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }
  req.trip = trip;
  next();
}

module.exports = { requireTripOwner };
