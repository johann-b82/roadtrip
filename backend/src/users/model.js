'use strict';

const { query } = require('../db/connection');

async function findByEmail(email) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function create(email, passwordHash) {
  const result = await query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
    [email, passwordHash]
  );
  return result.rows[0];
}

async function updatePassword(userId, passwordHash) {
  const result = await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [passwordHash, userId]
  );
  return result.rows[0];
}

async function updateHomeLocation(userId, address, lat, lon) {
  const result = await query(
    'UPDATE users SET home_address = $1, home_lat = $2, home_lon = $3, updated_at = NOW() WHERE id = $4 RETURNING id, email, home_address, home_lat, home_lon',
    [address, lat, lon, userId]
  );
  return result.rows[0];
}

module.exports = { findByEmail, findById, create, updatePassword, updateHomeLocation };
