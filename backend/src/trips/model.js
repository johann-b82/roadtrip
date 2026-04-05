'use strict';
const { query } = require('../db/connection');

async function createTrip({ userId, name, description, coverPhotoUrl, coverPhotoSource, selectedPhotoIndex }) {
  const result = await query(
    `INSERT INTO trips (user_id, name, description, cover_photo_url, cover_photo_source, selected_photo_index)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, name, description || null, coverPhotoUrl || null, coverPhotoSource || 'fallback', selectedPhotoIndex || 0]
  );
  return result.rows[0];
}

async function getTripsByUserId(userId) {
  const result = await query(
    `SELECT t.*,
       COUNT(s.id)::int AS stop_count,
       MIN(s.start_date) AS first_stop_date,
       MAX(s.end_date) AS last_stop_date
     FROM trips t
     LEFT JOIN stops s ON s.trip_id = t.id
     WHERE t.user_id = $1
     GROUP BY t.id
     ORDER BY t.created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function getTripById(tripId, userId) {
  const result = await query(
    'SELECT * FROM trips WHERE id = $1 AND user_id = $2',
    [tripId, userId]
  );
  return result.rows[0] || null;
}

async function updateTrip(tripId, userId, { name, description, coverPhotoUrl, coverPhotoSource, selectedPhotoIndex }) {
  const result = await query(
    `UPDATE trips
     SET name = COALESCE($3, name),
         description = COALESCE($4, description),
         cover_photo_url = COALESCE($5, cover_photo_url),
         cover_photo_source = COALESCE($6, cover_photo_source),
         selected_photo_index = COALESCE($7, selected_photo_index),
         updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [tripId, userId, name || null, description !== undefined ? description : null,
     coverPhotoUrl || null, coverPhotoSource || null, selectedPhotoIndex !== undefined ? selectedPhotoIndex : null]
  );
  return result.rows[0] || null;
}

async function deleteTrip(tripId, userId) {
  const result = await query(
    'DELETE FROM trips WHERE id = $1 AND user_id = $2 RETURNING id',
    [tripId, userId]
  );
  return result.rowCount > 0;
}

module.exports = { createTrip, getTripsByUserId, getTripById, updateTrip, deleteTrip };
