'use strict';
const axios = require('axios');

const OSRM_BASE_URL = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';

// In-memory route cache (coordinate string -> route result)
const routeCache = new Map();

/**
 * Get a route from OSRM for an array of [lon, lat] coordinate pairs.
 * NOTE: OSRM expects longitude first, then latitude.
 * @param {Array<[number, number]>} coordinates - Array of [lon, lat] pairs
 * @returns {Object} Route result with geometry, distance, duration, and legs
 */
async function getRoute(coordinates) {
  const coordString = coordinates.map(c => c[0] + ',' + c[1]).join(';');

  // Return cached result if available
  if (routeCache.has(coordString)) {
    return routeCache.get(coordString);
  }

  const url = `${OSRM_BASE_URL}/route/v1/driving/${coordString}?overview=full&geometries=polyline&steps=false&alternatives=false`;
  const response = await axios.get(url);

  if (response.data.code !== 'Ok') {
    throw new Error(`OSRM error: ${response.data.code} — ${response.data.message || 'Unknown error'}`);
  }

  const route = response.data.routes[0];
  const result = {
    geometry: route.geometry,
    distance: route.distance,
    duration: route.duration,
    legs: route.legs.map(leg => ({
      distance: leg.distance,
      duration: leg.duration,
    })),
  };

  routeCache.set(coordString, result);
  return result;
}

module.exports = { getRoute };
