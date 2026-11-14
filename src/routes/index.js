const express = require('express');
const authRoutes = require('./auth.routes');
const movieRoutes = require('./movie.routes');
const cinemaRoutes = require('./cinema.routes');
const showtimeRoutes = require('./showtime.routes');
const reservationRoutes = require('./reservation.routes');
const reportRoutes = require('./report.routes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/movies', movieRoutes);
router.use('/cinemas', cinemaRoutes);
router.use('/showtimes', showtimeRoutes);
router.use('/reservations', reservationRoutes);
router.use('/admin/reports', reportRoutes);

module.exports = router;

