'use strict';
const { query } = require('../db/connection');

/**
 * Return cached POIs for a stop if the cache is still fresh (< 24 hours old).
 * @param {string} stopId - UUID of the stop
 * @returns {Promise<Object[]>} Array of POI rows (empty if cache expired or missing)
 */
async function getCachedPOIs(stopId) {
  const result = await query(
    `SELECT * FROM pois
     WHERE stop_id = $1 AND cached_at > NOW() - INTERVAL '24 hours'
     ORDER BY name`,
    [stopId]
  );
  return result.rows;
}

/**
 * Replace the POI cache for a stop with a fresh set of POIs.
 * Deletes all existing POIs for the stop, then bulk-inserts the new ones.
 * @param {string} stopId - UUID of the stop
 * @param {Object[]} pois - Array of POI objects from service.js
 */
async function cachePOIs(stopId, pois) {
  // Clear existing cache for this stop
  await query('DELETE FROM pois WHERE stop_id = $1', [stopId]);

  if (!pois || pois.length === 0) {
    return;
  }

  // Build a multi-row INSERT for efficiency
  const columns = ['stop_id', 'osm_id', 'osm_type', 'name', 'category', 'lat', 'lon',
    'cuisine', 'opening_hours', 'website', 'phone', 'image_url', 'wikimedia_commons'];
  const numCols = columns.length;

  const values = [];
  const placeholders = pois.map((poi, i) => {
    const base = i * numCols;
    values.push(
      stopId,
      poi.osm_id,
      poi.osm_type,
      poi.name,
      poi.category,
      poi.lat,
      poi.lon,
      poi.cuisine || null,
      poi.opening_hours || null,
      poi.website || null,
      poi.phone || null,
      poi.image_url || null,
      poi.wikimedia_commons || null
    );
    return `(${columns.map((_, j) => `$${base + j + 1}`).join(', ')})`;
  });

  await query(
    `INSERT INTO pois (${columns.join(', ')}) VALUES ${placeholders.join(', ')}`,
    values
  );
}

/**
 * Retrieve all POIs for a stop regardless of cache age.
 * @param {string} stopId - UUID of the stop
 * @returns {Promise<Object[]>} Array of POI rows ordered by category and name
 */
async function getPOIsByStopId(stopId) {
  const result = await query(
    'SELECT * FROM pois WHERE stop_id = $1 ORDER BY category, name',
    [stopId]
  );
  return result.rows;
}

module.exports = { getCachedPOIs, cachePOIs, getPOIsByStopId };
