'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { Resend } = require('resend');

const { hashPassword, verifyPassword, issueTokens, hashToken } = require('./utils');
const userModel = require('../users/model');
const { query } = require('../db/connection');
const { requireAuth } = require('./middleware');

const router = express.Router();

// ─── Cookie options ───────────────────────────────────────────────────────────
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

const ACCESS_COOKIE_OPTS = { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 };         // 15 minutes
const REFRESH_COOKIE_OPTS = { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 }; // 7 days

// ─── Rate limiters ────────────────────────────────────────────────────────────
const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many signup attempts, please try again later.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset attempts, please try again later.' },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many reset password attempts, please try again later.' },
});

// ─── Helper: store refresh token in DB ───────────────────────────────────────
async function storeRefreshToken(userId, rawRefreshToken) {
  const tokenHash = hashToken(rawRefreshToken);
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [userId, tokenHash]
  );
}

// ─── POST /auth/signup ────────────────────────────────────────────────────────
router.post('/signup', signupLimiter, async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  // Input validation
  if (!email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Email, password, and confirmPassword are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  // Check for existing email
  const existing = await userModel.findByEmail(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  // Hash password and create user
  const passwordHash = await hashPassword(password);
  const user = await userModel.create(email.toLowerCase(), passwordHash);

  // Issue tokens and store refresh token
  const { accessToken, refreshToken } = issueTokens(user.id);
  await storeRefreshToken(user.id, refreshToken);

  // Set cookies
  res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTS);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);

  return res.status(201).json({ userId: user.id, email: user.email });
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // Anti-enumeration: same error regardless of whether user exists or password is wrong
  const user = await userModel.findByEmail(email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const { accessToken, refreshToken } = issueTokens(user.id);
  await storeRefreshToken(user.id, refreshToken);

  res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTS);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);

  return res.status(200).json({ userId: user.id, email: user.email });
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────
router.post('/logout', requireAuth, async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken;

  if (rawRefreshToken) {
    const tokenHash = hashToken(rawRefreshToken);
    await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
  }

  res.clearCookie('accessToken', COOKIE_OPTS);
  res.clearCookie('refreshToken', COOKIE_OPTS);

  return res.status(200).json({ success: true });
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken;

  if (!rawRefreshToken) {
    return res.status(401).json({ error: 'Refresh token missing.' });
  }

  let payload;
  try {
    payload = jwt.verify(rawRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }

  if (payload.type !== 'refresh') {
    return res.status(401).json({ error: 'Invalid token type.' });
  }

  // Check token exists in DB and is not expired
  const tokenHash = hashToken(rawRefreshToken);
  const result = await query(
    'SELECT * FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()',
    [tokenHash]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Refresh token not found or expired.' });
  }

  // Delete old refresh token (rotation)
  await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);

  // Issue new tokens
  const userId = payload.sub;
  const { accessToken, refreshToken: newRefreshToken } = issueTokens(userId);
  await storeRefreshToken(userId, newRefreshToken);

  res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTS);
  res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTS);

  return res.status(200).json({ success: true });
});

// ─── POST /auth/forgot-password ───────────────────────────────────────────────
router.post('/forgot-password', resetLimiter, async (req, res) => {
  const { email } = req.body;

  // Always return same response (anti-enumeration per research pitfall 6)
  const genericResponse = {
    message: 'If an account with that email exists, a reset link will be sent.',
  };

  if (!email) {
    return res.status(200).json(genericResponse);
  }

  const user = await userModel.findByEmail(email.toLowerCase());
  if (!user) {
    return res.status(200).json(genericResponse);
  }

  // Generate single-use reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(resetToken);

  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
    [user.id, tokenHash]
  );

  // Send email via Resend
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'RoadTrip <noreply@roadtrip.app>',
      to: user.email,
      subject: 'Reset your RoadTrip password',
      html: `<p>Click <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}">here</a> to reset your password. Link expires in 1 hour.</p>`,
    });
  } catch (emailErr) {
    // Log but don't expose email failure to client (security: anti-enumeration)
    console.error('Failed to send password reset email:', emailErr.message);
  }

  return res.status(200).json(genericResponse);
});

// ─── POST /auth/reset-password ────────────────────────────────────────────────
router.post('/reset-password', resetPasswordLimiter, async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and newPassword are required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  // Look up reset token
  const tokenHash = hashToken(token);
  const result = await query(
    'SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > NOW() AND used = FALSE',
    [tokenHash]
  );

  if (result.rows.length === 0) {
    return res.status(400).json({ error: 'Invalid or expired reset link.' });
  }

  const resetRecord = result.rows[0];

  // Hash new password and update user
  const passwordHash = await hashPassword(newPassword);
  await userModel.updatePassword(resetRecord.user_id, passwordHash);

  // Mark reset token as used (single-use)
  await query(
    'UPDATE password_reset_tokens SET used = TRUE WHERE id = $1',
    [resetRecord.id]
  );

  // Per D-07: auto-login after reset
  const { accessToken, refreshToken } = issueTokens(resetRecord.user_id);
  await storeRefreshToken(resetRecord.user_id, refreshToken);

  res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTS);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);

  return res.status(200).json({ success: true, message: 'Password reset. You are now logged in.' });
});

module.exports = router;
