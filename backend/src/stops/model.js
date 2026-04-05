'use strict';
const { query } = require('../db/connection');

async function createStop(tripId, { address, addressLat, addressLon, description, startDate, endDate }) {
  // Get next position
  const posResult = await query(
    'SELECT COALESCE(MAX(position) + 1, 0) AS next_pos FROM stops WHERE trip_id = $1',
    [tripId]
  );
  const position = posResult.rows[0].next_pos;

  const result = await query(
    `INSERT INTO stops (trip_id, address, address_lat, address_lon, description, start_date, end_date, position)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [tripId, address, addressLat || null, addressLon || null,
     description || null, startDate || null, endDate || null, position]
  );
  return result.rows[0];
}

async function getStopsByTripId(tripId) {
  const result = await query(
    'SELECT * FROM stops WHERE trip_id = $1 ORDER BY position ASC',
    [tripId]
  );
  return result.rows;
}

async function updateStop(stopId, tripId, { address, addressLat, addressLon, description, startDate, endDate }) {
  const result = await query(
    `UPDATE stops
     SET address = COALESCE($3, address),
         address_lat = COALESCE($4, address_lat),
         address_lon = COALESCE($5, address_lon),
         description = COALESCE($6, description),
         start_date = COALESCE($7, start_date),
         end_date = COALESCE($8, end_date),
         updated_at = NOW()
     WHERE id = $1 AND trip_id = $2
     RETURNING *`,
    [stopId, tripId, address || null, addressLat || null, addressLon || null,
     description !== undefined ? description : null,
     startDate !== undefined ? startDate : null,
     endDate !== undefined ? endDate : null]
  );
  return result.rows[0] || null;
}

async function deleteStop(stopId, tripId) {
  const result = await query(
    'DELETE FROM stops WHERE id = $1 AND trip_id = $2 RETURNING id',
    [stopId, tripId]
  );
  return result.rowCount > 0;
}

async function reorderStops(tripId, orderedIds) {
  // orderedIds: array of stop UUIDs in new order
  // Update each stop's position to match its index in the array
  const updates = orderedIds.map((id, index) =>
    query(
      'UPDATE stops SET position = $1, updated_at = NOW() WHERE id = $2 AND trip_id = $3',
      [index, id, tripId]
    )
  );
  await Promise.all(updates);
}

module.exports = { createStop, getStopsByTripId, updateStop, deleteStop, reorderStops };
