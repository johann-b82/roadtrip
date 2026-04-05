'use strict';
const { query } = require('../db/connection');

// Verifies the authenticated user owns the stop (via trip ownership)
async function requireStopOwner(req, res, next) {
  const stopId = req.params.id;
  const result = await query(
    `SELECT s.* FROM stops s
     JOIN trips t ON t.id = s.trip_id
     WHERE s.id = $1 AND t.user_id = $2`,
    [stopId, req.user.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Stop not found' });
  }
  req.stop = result.rows[0];
  next();
}

module.exports = { requireStopOwner };
