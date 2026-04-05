'use strict';

const passport = require('passport');
require('./strategies/jwt'); // Register JWT strategy

function requireAuth(req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: 'Authentication required' });
    req.user = user;
    next();
  })(req, res, next);
}

module.exports = { requireAuth };
