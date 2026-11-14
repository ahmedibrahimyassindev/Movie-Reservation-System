const request = require('supertest');
const app = require('../src/app');

describe('Showtimes and Reservations Route Validation', () => {
  it('POST /api/showtimes should reject invalid payload without auth (401)', async () => {
    const res = await request(app)
      .post('/api/showtimes')
      .send({});
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/reservations should reject request without auth (401)', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .send({
        showtimeId: '00000000-0000-0000-0000-000000000000',
        seatIds: ['00000000-0000-0000-0000-000000000001'],
      });
    expect(res.statusCode).toBe(401);
  });
});

