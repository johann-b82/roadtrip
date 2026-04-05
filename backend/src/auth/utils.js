'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const SALT_ROUNDS = 12; // per research: 12 rounds for production
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

async function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

function issueTokens(userId) {
  const accessToken = jwt.sign(
    { sub: userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  const refreshToken = jwt.sign(
    { sub: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  return { accessToken, refreshToken };
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

module.exports = { hashPassword, verifyPassword, issueTokens, hashToken };
