'use strict';
const axios = require('axios');

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Maps user-friendly search terms to Overpass tag filters
const SEARCH_TERM_MAP = {
  'restaurants': '["amenity"="restaurant"]',
  'coffee shops': '["amenity"="cafe"]',
  'cafes': '["amenity"="cafe"]',
  'bars': '["amenity"="bar"]',
  'hotels': '["tourism"~"hotel|motel"]',
  'camping': '["tourism"~"camp_site|caravan_site"]',
  'gas stations': '["amenity"="fuel"]',
  'supermarkets': '["shop"="supermarket"]',
  'hiking': '["route"="hiking"]',
  'museums': '["tourism"="museum"]',
  'parks': '["leisure"="park"]',
  'beaches': '["natural"="beach"]',
  'viewpoints': '["tourism"="viewpoint"]',
  'pharmacies': '["amenity"="pharmacy"]',
  'atm': '["amenity"="atm"]',
};

const POI_CATEGORIES = Object.keys(SEARCH_TERM_MAP);

/**
 * Map a raw Overpass element to a POI object.
 */
function elementToPOI(el) {
  return {
    osm_id: el.id,
    osm_type: el.type,
    lat: el.lat || el.center?.lat || null,
    lon: el.lon || el.center?.lon || null,
    name: el.tags?.name || 'Unnamed',
    category: el.tags?.amenity || el.tags?.tourism || el.tags?.leisure || el.tags?.natural || el.tags?.shop || el.tags?.route || 'other',
    cuisine: el.tags?.cuisine || null,
    opening_hours: el.tags?.opening_hours || null,
    website: el.tags?.website || null,
    phone: el.tags?.phone || null,
    image_url: el.tags?.image || null,
    wikimedia_commons: el.tags?.wikimedia_commons || null,
  };
}

/**
 * Build an Overpass QL query for multiple tag filters.
 * @param {string[]} tags - Array of tag filter strings like '["amenity"="restaurant"]'
 * @param {number} lat
 * @param {number} lon
 * @param {number} radius - Radius in meters
 * @returns {string} Full Overpass QL query string
 */
function buildOverpassQuery(tags, lat, lon, radius) {
  const parts = tags.map(tag => `nwr${tag}(around:${radius},${lat},${lon});`).join('\n');
  return `[out:json][timeout:25];\n(\n${parts}\n);\nout center tags;`;
}

/**
 * Post an Overpass query and return mapped POI objects.
 */
async function runOverpassQuery(query) {
  const response = await axios.post(
    OVERPASS_URL,
    `data=${encodeURIComponent(query)}`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  return response.data.elements
    .map(elementToPOI)
    .filter(poi => poi.lat != null && poi.lon != null);
}

/**
 * Query default POIs (restaurants, tourism, leisure) around a coordinate.
 * @param {number} lat
 * @param {number} lon
 * @param {number} [radius=5000] - Search radius in meters
 * @returns {Promise<Object[]>} Array of POI objects
 */
async function queryPOIs(lat, lon, radius = 5000) {
  const defaultTags = [
    '["amenity"~"restaurant|cafe|bar|fast_food"]',
    '["tourism"~"attraction|museum|viewpoint|hotel|motel|camp_site|caravan_site"]',
    '["leisure"~"park|nature_reserve|beach_resort"]',
  ];

  const query = buildOverpassQuery(defaultTags, lat, lon, radius);
  return runOverpassQuery(query);
}

/**
 * Search POIs around a coordinate using a user-provided search term.
 * @param {number} lat
 * @param {number} lon
 * @param {string} searchTerm - User search term
 * @param {number} [radius=5000] - Search radius in meters
 * @returns {Promise<Object[]>} Array of POI objects
 */
async function searchPOIs(lat, lon, searchTerm, radius = 5000) {
  const term = searchTerm.toLowerCase();
  const tag = SEARCH_TERM_MAP[term] || `["name"~"${term}",i]`;

  const query = buildOverpassQuery([tag], lat, lon, radius);
  return runOverpassQuery(query);
}

module.exports = { queryPOIs, searchPOIs, SEARCH_TERM_MAP, POI_CATEGORIES };
