const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/config');

describe('Neon Database End-to-End Verification', () => {
  let adminToken;
  let userToken;
  let showtimeId;
  let seatIds = [];
  let reservationId;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1. Connect to Neon and verify seeded user login (POST /api/auth/login)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john@example.com',
        password: 'User123!',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('token');
    userToken = res.body.data.token;

    // Also get admin token
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@moviereserve.com',
        password: 'Admin123!',
      });

    expect(adminRes.statusCode).toBe(200);
    adminToken = adminRes.body.data.token;
  });

  it('2. Fetch movie catalog from Neon (GET /api/movies)', async () => {
    const res = await request(app).get('/api/movies');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);

    const titles = res.body.data.map((m) => m.title);
    expect(titles).toContain('Inception');
    expect(titles).toContain('The Dark Knight');
  });

  it('3. Fetch cinema, halls, and showtimes from Neon', async () => {
    const cinemaRes = await request(app).get('/api/cinemas');
    expect(cinemaRes.statusCode).toBe(200);
    expect(cinemaRes.body.data.length).toBeGreaterThanOrEqual(1);

    const cinemaId = cinemaRes.body.data[0].id;

    const hallsRes = await request(app).get(`/api/cinemas/${cinemaId}/halls`);
    expect(hallsRes.statusCode).toBe(200);
    expect(hallsRes.body.data.length).toBeGreaterThanOrEqual(1);

    const showtimeRes = await request(app).get('/api/showtimes');
    expect(showtimeRes.statusCode).toBe(200);
    expect(showtimeRes.body.data.length).toBeGreaterThanOrEqual(1);
    showtimeId = showtimeRes.body.data[0].id;
  });

  it('4. Query seat layout and availability from Neon (GET /api/showtimes/:id/seats)', async () => {
    const res = await request(app).get(`/api/showtimes/${showtimeId}/seats`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('seats');
    expect(res.body.data.seats.length).toBeGreaterThan(0);

    // Pick 2 available seats
    const availableSeats = res.body.data.seats.filter((s) => s.isAvailable);
    expect(availableSeats.length).toBeGreaterThanOrEqual(2);
    seatIds = [availableSeats[0].id, availableSeats[1].id];
  });

  it('5. Atomically reserve seats in Neon (POST /api/reservations)', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        showtimeId,
        seatIds,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.status).toBe('CONFIRMED');
    expect(res.body.data.seats.length).toBe(2);
    reservationId = res.body.data.id;
  });

  it('6. Verify double booking prevention returns 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        showtimeId,
        seatIds: [seatIds[0]], // Try reserving the same seat
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toMatch(/already reserved/i);
  });

  it('7. Cancel reservation and verify seat release in Neon', async () => {
    const cancelRes = await request(app)
      .patch(`/api/reservations/${reservationId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    // Verify seats are available again
    const seatRes = await request(app).get(`/api/showtimes/${showtimeId}/seats`);
    const seatMap = new Map(seatRes.body.data.seats.map((s) => [s.id, s.isAvailable]));
    expect(seatMap.get(seatIds[0])).toBe(true);
    expect(seatMap.get(seatIds[1])).toBe(true);
  });

  it('8. Query Admin Analytics from Neon (GET /api/admin/reports/reservations)', async () => {
    const res = await request(app)
      .get('/api/admin/reports/reservations')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('totalReservations');
    expect(res.body.data).toHaveProperty('cancelledReservations');
    expect(res.body.data.cancelledReservations).toBeGreaterThanOrEqual(1);
  });
});

