'use strict';
const express = require('express');
const router = express.Router();
const { query } = require('../db/connection');

// GET /health — verify application and database are healthy
router.get('/', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
