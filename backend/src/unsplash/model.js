'use strict';
const { query } = require('../db/connection');
const { searchUnsplash } = require('./client');

async function getOrSearchUnsplash(searchQuery) {
  // Check cache first (only return if not expired)
  const cached = await query(
    'SELECT image_urls, image_metadata FROM unsplash_cache WHERE search_query = $1 AND expires_at > NOW()',
    [searchQuery]
  );

  if (cached.rows.length > 0) {
    return {
      urls: cached.rows[0].image_urls,
      metadata: cached.rows[0].image_metadata,
      cached: true,
      fallback: false,
    };
  }

  // Cache miss — fetch from Unsplash API
  try {
    const { urls, metadata } = await searchUnsplash(searchQuery);

    if (urls.length === 0) {
      return { urls: [], metadata: [], cached: false, fallback: true };
    }

    // Upsert into cache (24h TTL per D-17)
    await query(
      `INSERT INTO unsplash_cache (search_query, image_urls, image_metadata, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')
       ON CONFLICT ON CONSTRAINT unsplash_cache_query_unique
       DO UPDATE SET image_urls = $2, image_metadata = $3, cached_at = NOW(), expires_at = NOW() + INTERVAL '24 hours'`,
      [searchQuery, urls, JSON.stringify(metadata)]
    );

    return { urls, metadata, cached: false, fallback: false };
  } catch (err) {
    console.error('Unsplash API error:', err.message);
    return { urls: [], metadata: [], cached: false, fallback: true };
  }
}

module.exports = { getOrSearchUnsplash };
