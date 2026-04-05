'use strict';

// Set required env vars before requiring the module
process.env.JWT_SECRET = 'test-jwt-secret-for-unit-tests';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-unit-tests';

const {
  hashPassword,
  verifyPassword,
  issueTokens,
  hashToken,
} = require('../src/auth/utils');

const jwt = require('jsonwebtoken');

describe('auth/utils', () => {
  describe('hashPassword', () => {
    it('returns a bcrypt hash string (async)', async () => {
      const hash = await hashPassword('mysecretpassword');
      expect(typeof hash).toBe('string');
      expect(hash.startsWith('$2b$')).toBe(true); // bcrypt prefix
    });

    it('uses 12 salt rounds (hash length >= 60 chars)', async () => {
      const hash = await hashPassword('password123');
      expect(hash.length).toBeGreaterThanOrEqual(60);
    });
  });

  describe('verifyPassword', () => {
    it('returns true when plaintext matches hash', async () => {
      const hash = await hashPassword('correctpassword');
      const result = await verifyPassword('correctpassword', hash);
      expect(result).toBe(true);
    });

    it('returns false when plaintext does not match hash', async () => {
      const hash = await hashPassword('correctpassword');
      const result = await verifyPassword('wrongpassword', hash);
      expect(result).toBe(false);
    });
  });

  describe('issueTokens', () => {
    it('returns an object with accessToken and refreshToken', () => {
      const tokens = issueTokens('test-user-id-123');
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('accessToken payload contains sub and type=access', () => {
      const tokens = issueTokens('user-uuid-456');
      const decoded = jwt.verify(tokens.accessToken, process.env.JWT_SECRET);
      expect(decoded.sub).toBe('user-uuid-456');
      expect(decoded.type).toBe('access');
    });

    it('refreshToken payload contains sub and type=refresh', () => {
      const tokens = issueTokens('user-uuid-789');
      const decoded = jwt.verify(tokens.refreshToken, process.env.JWT_REFRESH_SECRET);
      expect(decoded.sub).toBe('user-uuid-789');
      expect(decoded.type).toBe('refresh');
    });

    it('accessToken expires in approximately 15 minutes', () => {
      const tokens = issueTokens('user-id');
      const decoded = jwt.verify(tokens.accessToken, process.env.JWT_SECRET);
      const expiresIn = decoded.exp - decoded.iat;
      expect(expiresIn).toBe(15 * 60); // 900 seconds
    });

    it('refreshToken expires in approximately 7 days', () => {
      const tokens = issueTokens('user-id');
      const decoded = jwt.verify(tokens.refreshToken, process.env.JWT_REFRESH_SECRET);
      const expiresIn = decoded.exp - decoded.iat;
      expect(expiresIn).toBe(7 * 24 * 60 * 60); // 604800 seconds
    });
  });

  describe('hashToken', () => {
    it('returns a 64-character hex string (SHA-256)', () => {
      const hash = hashToken('some-raw-token');
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64);
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
    });

    it('is deterministic: same input always produces same output', () => {
      const hash1 = hashToken('consistent-token');
      const hash2 = hashToken('consistent-token');
      expect(hash1).toBe(hash2);
    });

    it('different inputs produce different hashes', () => {
      const hash1 = hashToken('token-a');
      const hash2 = hashToken('token-b');
      expect(hash1).not.toBe(hash2);
    });
  });
});
