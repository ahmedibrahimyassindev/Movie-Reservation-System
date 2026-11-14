const request = require('supertest');
const app = require('../src/app');
const { generateToken, verifyToken } = require('../src/utils/jwt');

describe('Authentication & Validation Suite', () => {
  describe('JWT Utility Functions', () => {
    it('should generate and verify valid JWT tokens', () => {
      const payload = { userId: '123-abc', role: 'ADMIN' };
      const token = generateToken(payload);
      expect(typeof token).toBe('string');

      const decoded = verifyToken(token);
      expect(decoded.userId).toBe('123-abc');
      expect(decoded.role).toBe('ADMIN');
    });
  });

  describe('Validation on /api/auth/register', () => {
    it('should reject registration with missing password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Validation failed');
    });

    it('should reject registration with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'not-an-email',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('should reject registration with short password (< 6 chars)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: '123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });

  describe('Validation on /api/auth/login', () => {
    it('should reject login without password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com' });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });

  describe('Guarded endpoints without authentication token', () => {
    it('GET /api/auth/me should return 401 Unauthorized without Bearer token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('POST /api/movies should return 401 when accessed without token', async () => {
      const res = await request(app)
        .post('/api/movies')
        .send({
          title: 'Movie Title',
          genre: 'Drama',
          durationMinutes: 120,
        });
      expect(res.statusCode).toBe(401);
    });

    it('GET /api/admin/reports/reservations should return 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/admin/reports/reservations');
      expect(res.statusCode).toBe(401);
    });
  });
});

