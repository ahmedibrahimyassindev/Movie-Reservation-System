const request = require('supertest');
const app = require('../src/app');

describe('System Health & Root Endpoints', () => {
  it('GET / should return service information', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'Movie Reservation System API');
    expect(res.body).toHaveProperty('version');
  });

  it('GET /api/health should return status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/docs/ should serve the Swagger UI interactive documentation', async () => {
    const res = await request(app).get('/api/docs/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Swagger UI');
  });

  it('GET /unknown-route should return 404 error response', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('status', 'error');
  });
});

