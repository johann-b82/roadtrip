'use strict';
const axios = require('axios');

const UNSPLASH_API = 'https://api.unsplash.com';

async function searchUnsplash(searchQuery) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.warn('UNSPLASH_ACCESS_KEY not set; returning empty results');
    return { urls: [], metadata: [] };
  }

  const response = await axios.get(`${UNSPLASH_API}/search/photos`, {
    params: { query: searchQuery, per_page: 5, orientation: 'landscape' },
    headers: { Authorization: `Client-ID ${accessKey}` },
    timeout: 5000,
  });

  if (!response.data.results || response.data.results.length === 0) {
    return { urls: [], metadata: [] };
  }

  const urls = response.data.results.map(r => r.urls.regular);
  const metadata = response.data.results.map(r => ({
    photographer: r.user.name,
    photographerUrl: r.user.links.html,
    unsplashUrl: r.links.html,
    altDescription: r.alt_description || '',
  }));

  return { urls, metadata };
}

module.exports = { searchUnsplash };
