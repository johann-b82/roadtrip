'use strict';

const passport = require('passport');
const { Strategy: JwtStrategy } = require('passport-jwt');
const { findById } = require('../../users/model');

const cookieExtractor = (req) => {
  return req?.cookies?.accessToken || null;
};

passport.use(new JwtStrategy(
  {
    jwtFromRequest: cookieExtractor,
    secretOrKey: process.env.JWT_SECRET,
  },
  async (payload, done) => {
    try {
      if (payload.type !== 'access') return done(null, false);
      const user = await findById(payload.sub);
      if (!user) return done(null, false);
      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  }
));

module.exports = passport;
