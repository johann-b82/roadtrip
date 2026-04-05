'use strict';

// Mock the db connection so tests run without a real database
jest.mock('../src/db/connection', () => ({
  query: jest.fn(),
}));

const { query } = require('../src/db/connection');
const userModel = require('../src/users/model');

describe('users/model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('returns user row when found', async () => {
      const mockUser = { id: 'uuid-1', email: 'test@example.com', password_hash: 'hash' };
      query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await userModel.findByEmail('test@example.com');
      expect(result).toEqual(mockUser);
      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );
    });

    it('returns null when user not found', async () => {
      query.mockResolvedValueOnce({ rows: [] });
      const result = await userModel.findByEmail('notfound@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns user row when found', async () => {
      const mockUser = { id: 'uuid-1', email: 'test@example.com' };
      query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await userModel.findById('uuid-1');
      expect(result).toEqual(mockUser);
      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        ['uuid-1']
      );
    });

    it('returns null when user not found', async () => {
      query.mockResolvedValueOnce({ rows: [] });
      const result = await userModel.findById('nonexistent-id');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('inserts user and returns created row', async () => {
      const mockUser = { id: 'new-uuid', email: 'new@example.com', password_hash: '$2b$12$hash' };
      query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await userModel.create('new@example.com', '$2b$12$hash');
      expect(result).toEqual(mockUser);
      expect(query).toHaveBeenCalledWith(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
        ['new@example.com', '$2b$12$hash']
      );
    });
  });

  describe('updatePassword', () => {
    it('updates password_hash and returns updated row', async () => {
      const mockUser = { id: 'uuid-1', email: 'test@example.com', password_hash: 'new-hash' };
      query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await userModel.updatePassword('uuid-1', 'new-hash');
      expect(result).toEqual(mockUser);
      expect(query.mock.calls[0][0]).toContain('UPDATE users SET password_hash = $1');
      expect(query.mock.calls[0][1]).toContain('uuid-1');
    });
  });

  describe('updateHomeLocation', () => {
    it('updates home location and returns updated row', async () => {
      const mockUser = { id: 'uuid-1', email: 'test@example.com', home_address: 'Berlin', home_lat: 52.5, home_lon: 13.4 };
      query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await userModel.updateHomeLocation('uuid-1', 'Berlin', 52.5, 13.4);
      expect(result).toEqual(mockUser);
      expect(query.mock.calls[0][1]).toEqual(['Berlin', 52.5, 13.4, 'uuid-1']);
    });
  });
});
